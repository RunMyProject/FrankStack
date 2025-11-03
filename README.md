# FrankStack

**An AI-powered travel booking orchestration platform built on Microservices and AWS cloud-native infrastructure.**

---

## 🚀 Getting Started

### Prerequisites

Ensure all environment variables are properly configured before deployment.

#### Environment Configuration

1. Clone the repository and navigate to the project directory:

```bash
git clone https://github.com/RunMyProject/FrankStack.git
cd FrankStack/
nano .env.local
```

2. Configure the following required variables:

```bash
HOST_MODELS_DIR=/media/edoardo/data/ollama_models
OLLAMA_MODEL=gemma2:9b-instruct-q4_0
```

> **Note:** This project has been tested with Gemma 2 (9B parameters, Q4_0 quantization) for efficient inference on instruction-following tasks. You may select any compatible model that suits your requirements.

---

### Deployment

#### Starting the Platform

```bash
cd FrankStack
./deployFrankStack.sh
```

#### Post-Deployment Verification

1. **Verify AI Model Loading**

   Wait for the deployment to complete, then confirm all AI models are properly loaded:

   ```bash
   ./modelsList.sh
   ```
   
   Press `Ctrl+C` to exit the log stream.

2. **Check AWS Infrastructure**

   Verify that AWS SNS/SQS topics are provisioned and ready:

   ```bash
   ./show-topic.sh
   ```

3. **Access the Application**

   Once all services are operational, access the platform via the NGINX ingress controller:

   ```
   http://localhost
   ```

---

### Shutdown

To gracefully stop all services:

```bash
./undeployFrankStack.sh
```

---

## 📚 Documentation

For comprehensive documentation and historical release notes, refer to:

- [README_august_october.md](./README_august_october.md)

---

## 🏗️ Architecture Overview

> **Release Candidate (RC1) — Stable milestone ready for controlled testing and production-like validation.**

---

## 💡 Design & Architecture

FrankStack was designed with a clear principle in mind: **orchestration over chaos**.
The project reflects a pragmatic **software architect mindset**, balancing modular design with operational simplicity.

**Key points:**
- **Separation of Concerns:** services with single responsibilities for better scalability and testability.
- **Event-Driven Integration:** Kafka + AWS SNS/SQS for resilient, asynchronous workflows.
- **AI-First Approach:** local inference (Ollama) and provider-agnostic Node.js bridging.
- **Reactive UX:** React + Vite with SSE/WebSockets for realtime user feedback.
- **Cloud-Native Simplicity:** reproducible deployments via Docker Compose and deployment scripts.

### Project Structure

```
FrankStack/
├── 📁 frank-spring/                    # Spring Boot microservices
│   ├── frank-api-gateway/              # API Gateway service
│   ├── frank-orchestrator/             # Orchestration service
│   └── frank-kafka/                    # Kafka event streaming
│       ├── frank-kafka-hotel-consumer/
│       ├── frank-kafka-hotel-producer/
│       ├── frank-kafka-travel-consumer/
│       └── frank-kafka-travel-producer/
├── 📁 frank-aws/                       # AWS-integrated services
│   ├── frank-aws-api-gateway/          # AWS API Gateway
│   ├── frank-aws-lambda/               # Lambda functions
│   │   ├── frank-aws-lambda-payment-card-consumer/
│   │   └── frank-aws-lambda-payment-card-producer/
│   └── frank-aws-service/              # AWS service integrations
├── 📁 frank-react-vite/                # Frontend (React + Vite)
│                                       # SSE for Spring/Kafka streams
│                                       # WebSocket (WS) for Node.js bidirectional communication
├── 📁 frank-node-server/               # Node.js backend services
│                                       # Connects to Ollama or AI providers (OpenAI, etc.)
├── 📁 frank-node-stripe/               # Stripe payment integration
├── 📁 frank-node-s3/                   # S3 storage service
├── docker-compose.yml                  # Main orchestration
└── deployFrankStack.sh                 # Deployment script
```

### Technology Stack

- **AI/ML**: Ollama with Gemma 2 (9B, Q4_0) for intelligent inference
- **Container Runtime**: Docker with NVDIA CUDA support for AI workloads
- **Infrastructure**: Docker Compose, LocalStack, NGINX ingress
- **Frontend**: React with Vite (NGINX-filtered ingress)
- **Backend**: Spring Boot microservices, Node.js services
- **Real-time Communication**: 
  - WebSocket (WS) for bidirectional Node.js ↔ React streams
  - Server-Sent Events (SSE) for unidirectional Spring/Kafka → React streams
- **Event Streaming**: Apache Kafka (RedPanda), AWS SNS/SQS
- **Storage**: AWS S3, Redis cache
- **Payment Processing**: Stripe integration

---

*Last updated: November 3, 2025*
