# Guarded AI Chat Assistant on AWS Bedrock

A one-page website for a fictional bike shop, **Sparrow Lane Cycles**, with an AI chat assistant that answers customer questions from the shop's own facts and politely turns away abuse.

Built as part of Cloudboosta's *AI-Native Cloud* programme (Week 2).

## Architecture

Browser → **S3 static website** (index.html + chat-widget.js)
→ **API Gateway HTTP API** (`POST /chat`, throttled)
→ **AWS Lambda**
→ **Amazon Bedrock** (Nova Lite via the Converse API) + **Bedrock Guardrail**

## Files

| File | Purpose |
|---|---|
| `index.html` | The shop's website, generated with Claude on Bedrock |
| `chat-widget.js` | The chat box; sends messages to the API |
| `chatbot.py` | Terminal version of the assistant, used to test prompts and the guardrail |
| `first_call.py` | First Converse API call to Bedrock |
| `chat-policy.json` | IAM policy allowing the chat function to use the model and guardrail |

## What I did

- Wrote a system prompt that limits answers to the shop's facts, in British English, max 3 sentences
- Kept conversation history so follow-up questions have context
- Added and tuned a Bedrock Guardrail, tested with normal, harmful and prompt-injection messages
- When the guardrail blocks a message, it is removed from the history so it can't influence later replies
- Exposed the assistant through a throttled HTTP API to cap cost and abuse
- Diagnosed and fixed a CORS error: the API had no `AllowOrigins`, so the browser blocked the response. Fixed by allowing only the site's exact origin

## Screenshots

**The website**
![Website](screenshots/site.png)

**The assistant answering from the shop's facts, with follow-up context**
![Chat](screenshots/chat.png)

**The guardrail blocking a prompt-injection attempt, with the conversation continuing normally afterwards**
![Guardrail](screenshots/guardrail.png)

## Production improvements

- Use a **numbered guardrail version** instead of `DRAFT`, read from an environment variable, so safety rules can't change without testing
- Serve the site through **CloudFront with HTTPS** instead of the S3 website endpoint (HTTP only)
- Keep all IDs and URLs in environment variables rather than in files

## Running it

Replace the placeholders (`<ACCOUNT_ID>`, `<GUARDRAIL_ID>`, `<YOUR_API_URL>`) with your own values. All AWS resources were deleted after the lab.

## Skills

Amazon Bedrock · Bedrock Guardrails · Converse API · AWS Lambda · Amazon API Gateway · S3 static hosting · CORS · IAM
