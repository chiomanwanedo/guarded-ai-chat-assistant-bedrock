import os
import boto3

# 1. Connect to Bedrock in London and choose the model
client = boto3.client("bedrock-runtime", region_name="eu-west-2")
model_id = "amazon.nova-lite-v1:0"

# 2. The system prompt: the assistant's job description and the shop's facts
system_prompt = """You are the website assistant for Sparrow Lane Cycles, a small independent bike repair and hire shop in Leeds, UK.
Answer questions from customers using ONLY the facts below. Be friendly and brief: at most 3 short sentences.
Use British English and prices in pounds. If the answer is not in the facts, say you are not sure and give the phone number and email.
Never invent prices, times or services. You cannot take bookings or payments yourself: explain how to book instead.
Never ask for card details or other personal information.

FACTS
- Address: 14 Sparrow Lane, Leeds. Phone 0113 496 0123. Email hello@sparrowlane.example
- Opening hours: Tuesday to Friday 9:00-18:00, Saturday 9:00-17:00, Sunday 10:00-14:00. Closed Mondays and bank holidays.
- Puncture repair: 12 pounds, done while you wait (about 20 minutes).
- Basic service: 45 pounds. Brakes and gears adjusted, tyres pumped, chain cleaned and oiled. Ready the next working day.
- Full service: 95 pounds. Bike stripped and cleaned, bearings re-greased, wheels trued. Takes 2 to 3 working days.
- E-bike safety check: 60 pounds (motor and battery connections, brakes, tyres).
- Parts cost extra. We always ask before fitting any part over 20 pounds.
- Same-day basic service if you drop the bike off before 10:00.
- Booking: by phone, by email or in the shop. There is no online booking yet.
- Free collection and delivery within 3 miles of the shop for full services.
- Bike hire: city bike 25 pounds a day, e-bike 40 pounds a day, e-bike for a week 180 pounds. Riders must be 16 or over.
  Hire needs photo ID and a 100 pound refundable deposit. A helmet and a lock are included free.
- Payment: card, contactless and cash.
- Every repair has a 30-day workmanship guarantee."""

# 3. The conversation history: every message from both sides is added here
messages = []

# 4. Inference parameters: how the model writes its answers
temperature = float(os.environ.get("TEMPERATURE", "0.7"))
inference_config = {"maxTokens": 300, "temperature": temperature, "topP": 0.9}

# 5. Optional guardrail: used only when GUARDRAIL_ID is set
guardrail_id = os.environ.get("GUARDRAIL_ID")
extra = {}
if guardrail_id:
    extra["guardrailConfig"] = {"guardrailIdentifier": guardrail_id,
                                "guardrailVersion": "DRAFT",
                                "trace": "enabled"}

print(f"Sparrow Lane assistant (temperature {temperature}, guardrail {'ON' if guardrail_id else 'off'}).")
print("Ask a question, or type quit to stop.")

while True:
    user_input = input("\nYou: ").strip()
    if user_input.lower() in ("quit", "exit"):
        print("Goodbye!")
        break
    if not user_input:
        continue

    # 6. Add the customer's message, then send the WHOLE conversation
    messages.append({"role": "user", "content": [{"text": user_input}]})
    response = client.converse(
        modelId=model_id,
        messages=messages,
        system=[{"text": system_prompt}],
        inferenceConfig=inference_config,
        **extra,
    )
    reply = response["output"]["message"]["content"][0]["text"]

    # 7. Blocked by the guardrail: show the blocked message and forget that turn
    if response["stopReason"] == "guardrail_intervened":
        messages.pop()
        print(f"\nAssistant (blocked by the guardrail): {reply}")
        continue

    # 8. Keep the answer in the history so the next question has context
    messages.append({"role": "assistant", "content": [{"text": reply}]})
    usage = response["usage"]
    print(f"\nAssistant: {reply}")
    print(f"[turn {len(messages) // 2}, tokens in: {usage['inputTokens']}, out: {usage['outputTokens']}]")
