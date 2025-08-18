from langchain.callbacks.base import BaseCallbackHandler

class ReasoningCaptureHandler(BaseCallbackHandler):
    def __init__(self):
        self.reasoning_steps = []

    def on_chain_start(self, serialized, inputs, **kwargs):
        self.reasoning_steps.append(f"Chain started with inputs: {inputs}")

    def on_tool_start(self, serialized, input_str, **kwargs):
        self.reasoning_steps.append(f"Tool started: {serialized['name']} with input: {input_str}")

    def on_tool_end(self, output, **kwargs):
        self.reasoning_steps.append(f"Tool output: {output}")

    def on_chain_end(self, outputs, **kwargs):
        self.reasoning_steps.append(f"Chain ended with outputs: {outputs}")

    def get_reasoning(self):
        return "\n".join(self.reasoning_steps)
