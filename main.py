import os
import uvicorn
from fastapi import FastAPI
from langfuse import Langfuse
from pydantic import BaseModel
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from langchain_core.messages import SystemMessage, HumanMessage
from MarketInsight.components.agent import agent
from MarketInsight.utils.logger import get_logger

# Define the simplified schema directly here to avoid 422 errors
class RequestObject(BaseModel):
    prompt: str  # Changed from PromptObject to simple string
    threadId: Optional[str] = "default_thread"
    responseId: Optional[str] = "1"

logger = get_logger(__name__)
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows Vercel to talk to Render
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

langfuse = Langfuse(
    public_key=os.getenv("LANGFUSE_PUBLIC_KEY"),
    secret_key=os.getenv("LANGFUSE_SECRET_KEY"),
    host=os.getenv("LANGFUSE_HOST")
)

@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "Service is running"}

@app.post("/api/chat")
async def chat(request: RequestObject):
    config = {'configurable': {'thread_id': request.threadId}}
    
    async def generate():
        try:
            # Note: Removed '.content' because request.prompt is now a string
            with langfuse.start_as_current_observation(
                as_type="span", 
                name="chat-request",
                input=request.prompt
            ) as span:
                span.update(metadata={"user_id": request.threadId})
                
                with langfuse.start_as_current_observation(
                    as_type="generation",
                    name="agent-stream",
                    model="agentic-workflow",
                    input=request.prompt
                ) as generation:
                    
                    full_response = ""
                    for token, _ in agent.stream(
                        {
                            'messages': [
                                SystemMessage(content="You are a professional stock market analyst. Use tools for real-time data. Never fabricate financial data."),
                                HumanMessage(content=request.prompt) # No .content here
                            ]
                        },
                        stream_mode='messages',
                        config=config
                    ):
                        full_response += token.content
                        yield token.content
                    
                    generation.update(output=full_response)
                span.update(output="Request completed successfully")
                
        except Exception as e:
            logger.error(f"Error in chat: {e}")
            yield f"Error: {str(e)}"
    
    return StreamingResponse(generate(), media_type='text/event-stream')

if __name__ == '__main__':
    uvicorn.run(app, host='0.0.0.0', port=8000)