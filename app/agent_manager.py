import asyncio
import logging
from langchain_openai import ChatOpenAI
from langchain.chains import RetrievalQA
from langchain.agents import initialize_agent, Tool, AgentType
from langchain.memory import ConversationBufferMemory
from langchain_openai import OpenAIEmbeddings
from .vector_store_utils import build_or_update_vector_store
import os

logger = logging.getLogger(__name__)

class AgentManager:
    def __init__(self):
        self.agents = {}
        self.memories = {}

    async def get_agent(self, company):
        """
        Always create an agent that acts as an assistant to the vector store.
        The agent uses the vector store retriever as its main tool.
        """
        try:
            if company.name in self.agents:
                return self.agents[company.name]
            
            # Initialize embeddings with error handling
            embeddings = OpenAIEmbeddings(
                openai_api_key=os.getenv("OPENAI_API_KEY")
            )
            
            vector_store = await build_or_update_vector_store(company.name, embeddings)
            retriever = vector_store.as_retriever(search_kwargs={"k": 3})
            llm = ChatOpenAI(
                model_name=company.model_name, 
                temperature=company.temperature,
                openai_api_key=os.getenv("OPENAI_API_KEY")
            )
            qa_chain = RetrievalQA.from_chain_type(llm, retriever=retriever)
            
            tools = [
                Tool(
                    name=f"{company.name}_assistant",
                    func=qa_chain.run,
                    description=f"Assistant for {company.name}: answers questions using the company's knowledge base."
                )
            ]
            
            memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)
            self.memories[company.name] = memory
            
            agent = initialize_agent(
                tools,
                llm,
                agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
                verbose=True,
                memory=memory,
                handle_parsing_errors=True
            )
            
            self.agents[company.name] = agent
            logger.info(f"Created agent for company: {company.name}")
            return agent
            
        except Exception as e:
            logger.error(f"Error creating agent for company {company.name}: {e}")
            raise

    def reset_agent_memory(self, company_name: str):
        """Reset agent memory for a specific company"""
        try:
            if company_name in self.memories:
                self.memories[company_name].clear()
                logger.info(f"Reset memory for company: {company_name}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error resetting agent memory for {company_name}: {e}")
            return False
    
    def clear_agent(self, company_name: str):
        """Completely remove an agent and its memory"""
        try:
            if company_name in self.agents:
                del self.agents[company_name]
            if company_name in self.memories:
                del self.memories[company_name]
            logger.info(f"Cleared agent for company: {company_name}")
            return True
        except Exception as e:
            logger.error(f"Error clearing agent for {company_name}: {e}")
            return False

agent_manager = AgentManager()
