import boto3

# 1. Connect to the Bedrock runtime in London and choose the model
client = boto3.client("bedrock-runtime", region_name="eu-west-2")
model_id = "amazon.nova-lite-v1:0"

# 2. The conversation so far: one message from the user
messages = [
    {"role": "user",
     "content": [{"text": "In two sentences, what should a bike shop check during a basic service?"}]}
]

# 3. Send the messages to the model with the Converse API
response = client.converse(modelId=model_id, messages=messages)

# 4. Dig the answer and the token counts out of the response
answer = response["output"]["message"]["content"][0]["text"]
usage = response["usage"]
print(answer)
print(f"\n[tokens in: {usage['inputTokens']}, tokens out: {usage['outputTokens']}]")
