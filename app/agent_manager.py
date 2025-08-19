import asyncio
import logging
import time
import os
from typing import Dict, Optional
from langchain_openai import ChatOpenAI
from langchain.agents import initialize_agent, AgentType
from langchain.tools import Tool
from langchain.chains import RetrievalQA
from langchain.memory import ConversationBufferMemory
from app.vector_store_utils import build_or_update_vector_store
from app import models

logger = logging.getLogger(__name__)

# Constants
BASE_COMPANY_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "companies")

class AgentManager:
    def __init__(self, max_agents: int = 10, agent_ttl: int = 3600):
        self.agents: Dict[int, dict] = {}  # Changed from str to int (company_id)
        self.memories: Dict[int, ConversationBufferMemory] = {}  # Changed from str to int
        self.max_agents = max_agents
        self.agent_ttl = agent_ttl
        self.last_used: Dict[int, float] = {}  # Changed from str to int

    def can_create_agent(self, company) -> tuple[bool, str]:
        """Check if an agent can be created for a company"""
        try:
            # Check company configuration
            if not company.model_name:
                return False, "Company model_name is not configured"
            
            if company.temperature is None:
                return False, "Company temperature is not configured"
            
            # Check OpenAI API key
            openai_api_key = os.getenv("OPENAI_API_KEY")
            if not openai_api_key:
                return False, "OpenAI API key not configured"
            
            return True, "Agent can be created"
            
        except Exception as e:
            return False, f"Error checking agent creation: {str(e)}"

    def get_agent_stats(self) -> dict:
        """Get statistics about current agents"""
        return {"total_agents": len(self.agents), "max_agents": self.max_agents}

    async def get_agent(self, company, embeddings):
        """Get or create an agent for a company"""
        company_id = company.id
        company_name = company.name
        
        # Check if agent exists and is still valid
        if company_id in self.agents:
            agent_info = self.agents[company_id]
            if time.time() - self.last_used.get(company_id, 0) < self.agent_ttl:
                self.last_used[company_id] = time.time()
                return agent_info['agent']
            else:
                # Agent expired, remove it
                logger.info(f"Agent for company {company_name} (ID: {company_id}) expired, removing")
                self._remove_agent(company_id)
        
        # Create new agent
        logger.info(f"Creating new agent for company: {company_name} (ID: {company_id})")
        agent = await self._create_agent(company, embeddings)
        
        # Store agent info
        self.agents[company_id] = {
            'agent': agent,
            'created_at': time.time(),
            'company_id': company_id,
            'company_name': company_name  # Keep name for reference
        }
        self.last_used[company_id] = time.time()
        
        # Clean up old agents if we exceed max_agents
        self._cleanup_old_agents()
        
        return agent

    async def _create_agent(self, company, embeddings):
        """Create a new agent for a company"""
        try:
            logger.info(f"Starting agent creation for company: {company.name}")
            
            # Check if embeddings are available
            if not embeddings:
                raise RuntimeError("Embeddings not available")
            logger.info("Embeddings validation passed")
            
            # Validate company configuration
            if not company.model_name:
                raise RuntimeError("Company model_name is not configured")
            
            if company.temperature is None:
                raise RuntimeError("Company temperature is not configured")
            logger.info(f"Company configuration validation passed: model={company.model_name}, temp={company.temperature}")
            
            # Check OpenAI API key
            openai_api_key = os.getenv("OPENAI_API_KEY")
            if not openai_api_key:
                raise RuntimeError("OpenAI API key not configured")
            logger.info("OpenAI API key validation passed")
            
            # Check if company has PDF files before building vector store
            company_pdf_dir = os.path.join(BASE_COMPANY_DIR, company.name)
            if not os.path.exists(company_pdf_dir):
                raise RuntimeError(f"Company PDF directory does not exist: {company_pdf_dir}")
            
            pdf_files = [f for f in os.listdir(company_pdf_dir) if f.endswith('.pdf')]
            if not pdf_files:
                raise RuntimeError(f"No PDF files found in company directory: {company_pdf_dir}. Please upload PDF documents first.")
            
            logger.info(f"Found {len(pdf_files)} PDF files for company: {company.name}")
            
            logger.info(f"Building vector store for company: {company.name}")
            # Build vector store
            vector_store = await build_or_update_vector_store(company.name, embeddings)
            logger.info("Vector store built successfully")
            
            # Validate vector store - use the functions directly instead of importing
            if not hasattr(vector_store, 'index_to_docstore_id') or len(vector_store.index_to_docstore_id) == 0:
                raise RuntimeError("Vector store is not valid or empty")
            
            doc_count = len(vector_store.index_to_docstore_id)
            logger.info(f"Vector store has {doc_count} documents")
            
            logger.info("Creating retrieval tool...")
            # Create retrieval tool with proper vector store integration
            qa_chain = RetrievalQA.from_chain_type(
                ChatOpenAI(
                    openai_api_key=openai_api_key,
                    model_name=company.model_name,
                    temperature=company.temperature
                ),
                chain_type="stuff",
                retriever=vector_store.as_retriever(search_kwargs={"k": doc_count})  # Use ALL documents
            )
            logger.info("Retrieval tool created successfully")
            
            logger.info("Creating tools list...")
            # Create tools with better descriptions and proper vector store access
            def pdf_qa_tool(question: str) -> str:
                """Wrapper function to properly call the QA chain"""
                try:
                    logger.info(f"PDF QA tool called with question: {question}")
                    logger.info(f"Vector store has {doc_count} documents available")
                    
                    response = qa_chain.invoke({"query": question})
                    answer = response.get("result", "No answer found")
                    
                    # Clean up the answer
                    if isinstance(answer, str):
                        answer = answer.strip()
                        # Remove any extra formatting or escape characters
                        if "\\n" in answer or "\\t" in answer:
                            answer = answer.replace("\\n", " ").replace("\\t", " ")
                        # Remove extra spaces and normalize
                        answer = " ".join(answer.split())
                        # Remove any remaining escape characters
                        answer = answer.replace("\\", "")
                    else:
                        answer = str(answer)
                    
                    logger.info(f"PDF QA tool response: {answer[:200]}...")
                    return answer
                except Exception as e:
                    logger.error(f"Error in PDF QA tool: {e}")
                    return f"Error processing question: {str(e)}"
            
            tools = [
                Tool(
                    name="pdf_qa",
                    func=pdf_qa_tool,  # Use our wrapper function
                    description="""Use this tool to answer questions about PDF documents. 
                    Input should be a clear, specific question about the company's documents.
                    Examples: "What is the customer's name?", "What are the policy details?", "What is the phone number?"
                    Always provide a complete, helpful answer based on the document content.
                    This tool searches through all uploaded PDF documents to find relevant information."""
                )
            ]
            logger.info(f"Tools list created with {len(tools)} tools")
            
            logger.info("Creating memory...")
            # Create memory using modern pattern
            memory = ConversationBufferMemory(
                memory_key="chat_history",
                return_messages=True
            )
            logger.info("Memory created successfully")
            
            logger.info("Initializing agent...")
            # Initialize agent using modern pattern with better error handling
            agent = initialize_agent(
                tools,
                ChatOpenAI(
                    openai_api_key=openai_api_key,
                    model_name=company.model_name,
                    temperature=company.temperature,
                    max_tokens=company.max_tokens if hasattr(company, 'max_tokens') else 1000
                ),
                agent=AgentType.CONVERSATIONAL_REACT_DESCRIPTION,
                memory=memory,
                verbose=True,
                handle_parsing_errors=True,
                max_iterations=3,  # Limit iterations to prevent infinite loops
                early_stopping_method="generate",  # Better stopping method
                return_intermediate_steps=True,  # Get intermediate steps for analysis
                agent_kwargs={
                    "system_message": """You are a helpful AI assistant that answers questions about PDF documents.
                    IMPORTANT: You have access to a PDF QA tool that can search through uploaded documents. 
                    ALWAYS use the pdf_qa tool to answer questions about documents, policies, or company information.
                    
                    When a user asks a question:
                    1. Use the pdf_qa tool to search the documents
                    2. Provide a complete, helpful answer based on the tool's response
                    3. If the tool doesn't find relevant information, say so clearly
                    4. Be conversational but professional in your responses
                    
                    Remember: The pdf_qa tool searches through all uploaded PDF documents to find relevant information."""
                }
            )
            
            logger.info(f"Agent created successfully for company: {company.name}")
            return agent
            
        except Exception as e:
            logger.error(f"Failed to create agent for company {company.name}: {e}", exc_info=True)
            raise RuntimeError(f"Failed to create agent: {str(e)}")

    def reset_agent_memory(self, company_id: int) -> bool:
        """Reset memory for a specific agent"""
        if company_id in self.memories:
            self.memories[company_id] = ConversationBufferMemory(
                memory_key="chat_history",
                return_messages=True
            )
            return True
        return False

    def clear_agent_memory(self, company_id: int) -> bool:
        """Clear memory for a specific agent"""
        if company_id in self.agents:
            try:
                agent = self.agents[company_id]['agent']
                if hasattr(agent, 'memory') and hasattr(agent.memory, 'clear'):
                    agent.memory.clear()
                    company_name = self.agents[company_id].get('company_name', str(company_id))
                    logger.info(f"Cleared memory for agent: {company_name} (ID: {company_id})")
                    return True
                else:
                    company_name = self.agents[company_id].get('company_name', str(company_id))
                    logger.warning(f"Agent {company_name} (ID: {company_id}) has no clearable memory")
                    return False
            except Exception as e:
                company_name = self.agents[company_id].get('company_name', str(company_id))
                logger.error(f"Error clearing memory for agent {company_name} (ID: {company_id}): {e}")
                return False
        return False

    def _remove_agent(self, company_id: int):
        """Remove an agent from memory"""
        if company_id in self.agents:
            company_name = self.agents[company_id].get('company_name', str(company_id))
            logger.info(f"Removing agent for company: {company_name} (ID: {company_id})")
            del self.agents[company_id]
            if company_id in self.last_used:
                del self.last_used[company_id]
            if company_id in self.memories:
                del self.memories[company_id]

    def force_remove_agent(self, company_id: int) -> bool:
        """Force remove an agent (admin function)"""
        if company_id in self.agents:
            company_name = self.agents[company_id].get('company_name', str(company_id))
            logger.info(f"Force removing agent for company: {company_name} (ID: {company_id})")
            self._remove_agent(company_id)
            return True
        return False

    def force_update_agent(self, company_id: int) -> bool:
        """Force update an agent by removing it so it gets recreated with new vector store"""
        if company_id in self.agents:
            company_name = self.agents[company_id].get('company_name', str(company_id))
            logger.info(f"Force updating agent for company: {company_name} (ID: {company_id})")
            self._remove_agent(company_id)
            return True
        return False

    def agent_needs_update(self, company_id: int, vector_store_doc_count: int) -> bool:
        """Check if agent needs to be updated based on vector store changes"""
        if company_id not in self.agents:
            return True  # No agent exists, needs creation
        
        # Check if the agent was created before the last vector store update
        # This is a simple heuristic - in practice, you might want to track vector store timestamps
        return False  # For now, always return False as we handle updates explicitly

    def _cleanup_old_agents(self):
        """Clean up old agents based on TTL"""
        current_time = time.time()
        to_remove = []
        
        for company_id, last_used_time in self.last_used.items():
            if current_time - last_used_time > self.agent_ttl:
                to_remove.append(company_id)
        
        for company_id in to_remove:
            company_name = self.agents[company_id].get('company_name', str(company_id))
            logger.info(f"Cleaning up expired agent for company: {company_name} (ID: {company_id})")
            self._remove_agent(company_id)

    def get_agent_info(self, company_id: int) -> Optional[dict]:
        """Get detailed info about a specific agent"""
        if company_id not in self.agents:
            return None
        
        agent_info = self.agents[company_id]
        
        # Get fresh company data from database to avoid session issues
        from app.database import get_db
        db = next(get_db())
        company = db.query(models.Company).filter(models.Company.id == company_id).first()
        
        if not company:
            return None
        
        return {
            'company_id': company_id,
            'company_name': company.name,
            'company_model': company.model_name,
            'company_temperature': company.temperature,
            'agent_created_at': agent_info['created_at'],
            'last_used': agent_info['last_used'],
            'agent_age_seconds': time.time() - agent_info['created_at'],
            'memory_entries': len(agent_info['agent'].memory.chat_memory.messages) if hasattr(agent_info['agent'], 'memory') else 0,
            'tools_count': len(agent_info['agent'].tools) if hasattr(agent_info['agent'], 'tools') else 0
        }

    def get_all_agents(self) -> Dict[int, dict]:
        """Get information about all agents"""
        result = {}
        for company_id, agent_info in self.agents.items():
            company_name = agent_info.get('company_name', str(company_id))
            result[company_id] = {
                'company_id': company_id,
                'company_name': company_name,
                'created_at': agent_info['created_at'],
                'last_used': self.last_used.get(company_id, 0),
                'age_seconds': time.time() - agent_info['created_at'],
                'ttl_remaining': self.agent_ttl - (time.time() - self.last_used.get(company_id, 0))
            }
        return result

    def get_company_agent_status(self, company_id: int) -> Optional[dict]:
        """Get agent status for a specific company"""
        if company_id not in self.agents:
            return None
        
        agent_info = self.agents[company_id]
        company_name = agent_info.get('company_name', str(company_id))
        
        return {
            'company_id': company_id,
            'company_name': company_name,
            'agent_exists': True,
            'created_at': agent_info['created_at'],
            'last_used': self.last_used.get(company_id, 0),
            'age_seconds': time.time() - agent_info['created_at'],
            'ttl_remaining': self.agent_ttl - (time.time() - self.last_used.get(company_id, 0)),
            'status': 'active' if time.time() - self.last_used.get(company_id, 0) < self.agent_ttl else 'expired'
        }

    def get_agent_count_for_company(self, company_id: int) -> int:
        """Get the number of agents for a specific company (should always be 0 or 1)"""
        return 1 if company_id in self.agents else 0

# Create global instance
agent_manager = AgentManager()
