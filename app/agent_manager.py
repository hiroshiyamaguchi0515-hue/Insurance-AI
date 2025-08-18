import asyncio
from langchain_community.chat_models import ChatOpenAI
from langchain.chains import RetrievalQA
from langchain.agents import initialize_agent, Tool, AgentType
from langchain.memory import ConversationBufferMemory
from langchain_openai import OpenAIEmbeddings
from .vector_store_utils import build_or_update_vector_store

class AgentManager:
    def __init__(self):
        self.agents = {}
        self.memories = {}

    async def get_agent(self, company):
        if company.name in self.agents:
            return self.agents[company.name]
        embeddings = OpenAIEmbeddings()
        vector_store = await build_or_update_vector_store(company.name, embeddings)
        retriever = vector_store.as_retriever(search_kwargs={"k": 3})
        llm = ChatOpenAI(model_name=company.model_name, temperature=company.temperature)
        qa_chain = RetrievalQA.from_chain_type(llm, retriever=retriever)
        tools = [
            Tool(
                name=f"{company.name}_retriever",
                func=qa_chain.run,
                description=f"Answer questions using {company.name} knowledge base"
            )
        ]
        memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)
        self.memories[company.name] = memory
        agent = initialize_agent(tools, llm, agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
                                 verbose=True, memory=memory)
        self.agents[company.name] = agent
        return agent

    def reset_agent_memory(self, company_name: str):
        if company_name in self.memories:
            self.memories[company_name].clear()
            return True
        return False

agent_manager = AgentManager()
