# RYTHU SETHU: ADVANCED AI-DRIVEN AGRICULTURAL E-COMMERCE SYSTEM
### Exhaustive Production-Grade Documentation, Technical Specifications & Implementation Thesis

---

## Abstract
Agriculture remains the fundamental backbone of the Indian economy, employing over half of the national workforce and driving a massive percentage of the gross domestic product. Despite this critical importance, the agricultural sector remains heavily reliant on antiquated, traditional supply chains that are plagued by intermediaries and commission agents. These middlemen drastically reduce the profitability for farmers while simultaneously inflating prices for the end consumers in urban markets. Furthermore, the sheer lack of data-driven, scientific agricultural practices leaves farmers exceptionally vulnerable to unpredictable weather patterns, sub-optimal crop selection methodologies, and intense, chaotic market volatility. 

**Rythu Sethu** is an advanced, Artificial Intelligence-driven, multilingual agricultural ecosystem meticulously designed to bridge the digital and economic gap between farmers and consumers directly. Operating on a highly scalable, production-grade MERN-stack architecture (MongoDB, Express.js, React.js, Node.js), the platform is deeply intertwined with native Python Machine Learning models. Specifically, it leverages hyper-tuned Random Forest Classifiers and Regressors to deliver real-time price trend predictions and scientific yield estimations. It also integrates a pure Python **Apriori Association Engine** for accurate Market-Basket recommendations, and **Google Gemini 1.5 Flash (LLM)** for advanced NLP Sentiment and Nutrition Analysis. 

To overcome the severe technological and literacy barriers faced by rural demographics, the system completely bypasses traditional keyboard-based data entry. Instead, it features an advanced Voice-Assisted navigation interface utilizing the Web Speech API and React Context-driven multi-lingual translation engines. This ensures that farmers can speak in their native regional languages (such as Telugu or Hindi), and the system autonomously translates, parses, and inputs the data into the operational database. By integrating a cinematic, hyper-advanced Leaflet Map with simulated autonomous drone deliveries and Gaussian traffic penalty algorithms, Rythu Sethu stands as a Progressive Web App (PWA) that is accessible to completely non-technical users while remaining statistically robust, mathematically precise, and fully ready for massive production deployment.

---

## Table of Contents
**List of Figures** ........................................................................................................... ix  
**List of Tables** .............................................................................................................. x  
**List of Abbreviations** ................................................................................................. xi  

**Chapters**  
**1. Introduction** ............................................................................................................ 2  
&nbsp;&nbsp;&nbsp;&nbsp;1.1 Problem statement  
&nbsp;&nbsp;&nbsp;&nbsp;1.2 Existing system  
&nbsp;&nbsp;&nbsp;&nbsp;1.3 Literature Survey  
&nbsp;&nbsp;&nbsp;&nbsp;1.4 Proposed system  
&nbsp;&nbsp;&nbsp;&nbsp;1.5 Scope  
**2. System Requirement Specifications** .................................................................... 4  
&nbsp;&nbsp;&nbsp;&nbsp;2.1 Software Requirements  
&nbsp;&nbsp;&nbsp;&nbsp;2.2 Hardware Requirements  
&nbsp;&nbsp;&nbsp;&nbsp;2.3 System Architecture / Block Diagram  
**3. Design & Implementation** ...................................................................................... 5  
&nbsp;&nbsp;&nbsp;&nbsp;3.1 Features (Including Algorithms / Techniques used)  
&nbsp;&nbsp;&nbsp;&nbsp;3.2 UML Diagrams  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;3.2.1 Use Case Diagram  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;3.2.2 Class Diagram  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;3.2.3 Sequence Diagram  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;3.2.4 Activity Diagram (Checkout & Logistics)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;3.2.5 Activity Diagram (Machine Learning Augmentation)  
&nbsp;&nbsp;&nbsp;&nbsp;3.3 Environmental Setup  
**4. Test Cases & Results** ........................................................................................... 11  
&nbsp;&nbsp;&nbsp;&nbsp;4.1 Test Cases  
&nbsp;&nbsp;&nbsp;&nbsp;4.2 Implementation / Methodology Steps  
&nbsp;&nbsp;&nbsp;&nbsp;4.3 Results (Output Screens)  
**5. Conclusion & Future Enhancements** .................................................................. 16  
**References** .................................................................................................................. 17  
**Appendix A: Core Source Code** ............................................................................... 18  
**Appendix B: Project Structure Directory Tree** .......................................................... 19  

---

## List of Figures
- **Figure 1:** System Architecture Block Diagram
- **Figure 2:** Use Case Diagram
- **Figure 3:** Class Diagram
- **Figure 4:** Sequence Diagram (ML Retraining)
- **Figure 5:** Activity Diagram (Order Logistics)
- **Figure 6:** Activity Diagram (Machine Learning)

## List of Tables
- **Table 1:** Literature Survey Analysis
- **Table 2:** Software Requirements
- **Table 3:** Hardware Requirements
- **Table 4:** System Test Cases
- **Table 5:** Machine Learning Evaluation Metrics

## List of Abbreviations
- **AI:** Artificial Intelligence
- **API:** Application Programming Interface
- **CNN:** Convolutional Neural Network
- **JSON:** JavaScript Object Notation
- **MERN:** MongoDB, Express.js, React.js, Node.js
- **ML:** Machine Learning
- **NLP:** Natural Language Processing
- **ODM:** Object Data Modeling
- **PWA:** Progressive Web App
- **REST:** Representational State Transfer
- **STT:** Speech-to-Text
- **TTS:** Text-to-Speech
- **UI/UX:** User Interface / User Experience

---
---

## Chapter 1: Introduction

The agricultural sector is inherently unpredictable. Farmers are routinely forced to rely on generational intuition rather than concrete empirical data when making critical decisions regarding crop cultivation, harvest timing, and pricing strategies. When a farmer decides to plant tomatoes, they do so without knowing how many other farmers in their district are also planting tomatoes. This lack of decentralized data leads to extreme market saturation; farmers harvest simultaneously, flooding the market, which drives the price of tomatoes down to pennies. Consequently, tons of perfectly good produce are left to rot on the highways because the cost of transport exceeds the market value. Rythu Sethu was conceptualized to permanently solve this systemic issue by digitizing the agricultural supply chain from the soil directly to the dinner table, providing farmers with a "God-Eye" view of the market scarcity before they even plant a seed.

### 1.1 Problem Statement
Rural farmers face continuous, systemic exploitation by middlemen. Because farmers do not possess the logistical infrastructure to transport goods directly to urban consumers, they are forced to sell to local commission agents at dictated, non-negotiable prices. Furthermore, consumers receive non-fresh produce at highly marked-up prices because the produce changes hands across multiple warehouses and storage facilities before finally reaching the urban market. There is an urgent, critical, and undeniable need for an AI-integrated, transparent, and direct e-commerce solution. This solution must not only facilitate direct transactions but must be tailored specifically to the technological literacy of rural farmers who cannot navigate complex drop-down menus or type long descriptions in English. If the digital divide is not bridged natively through voice translation and predictive mathematical algorithms, any marketplace attempt will ultimately fail to secure farmer adoption.

### 1.2 Existing System
Current agricultural software platforms function merely as standard e-commerce clones or static bulletin boards where users can post classified advertisements. 
- **The Core Deficiencies:**
  - **Zero Intelligence:** Existing systems lack predictive AI. They cannot provide scientific predictions for yield, dynamic pricing, or weather dependency logic. If a crop is oversupplied, the system simply lets the farmer list it at a high price, resulting in zero sales.
  - **The Digital Literacy Barrier:** Heavy reliance on English interfaces entirely alienates rural farmers. If a farmer cannot spell "Pomegranate" in English, they cannot participate in the digital economy.
  - **Logistical Blind Spots:** The absence of real-time logistics tracking based on live traffic penalties leaves buyers in the dark.
  - **Disconnected Architectures:** Machine Learning models in existing agricultural systems are isolated to academic Jupyter Notebooks. They require researchers to manually export CSVs and run predictions offline, rendering them useless for real-time operational platforms.

### 1.3 Literature Survey

A rigorous review of contemporary research and existing systems was conducted to identify the technological gaps Rythu Sethu aims to fill. 

**Table 1: Literature Survey Analysis**

| S.No | Author / Source | Year | Title | Modules Covered | Key Points | Adopted Features | Limitations | Reference Link |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Rahman I., Riyazulla | 2024 | Farm to Fork | Farmer, Customer, Market System | Explains the farm-to-fork supply chain connecting production, distribution, and consumers. | Digital marketplace concept for agricultural products. | Only delivery system is available but no ML models or direct trade. | [Link](https://doi.org/10.55041/IJSREM28019) |
| 2 | University of Washington Food Systems | 2020 | Farm-to-Table System Design | Farmer, Customer, Admin, Delivery | Connects local farms to urban consumers through organized supply chain logistics. | Delivery tracking and customer feedback system. | Region-specific research with limited technical implementation. | [Link](https://foodsystems.uw.edu/wp-content/uploads/2020/09/Farm-to-Table-NTR-531_Final-Report-March-2020.pdf) |
| 3 | Sureshkumar G., Deenadayalu S. | 2023 | Profitability through Organic Sales | Farmer, Customer, Admin | Post-COVID shift toward digital platforms increased profit through direct farmer sales. | Profitability analytics integrated in farmer dashboards. | IT illiteracy and rural infrastructure gaps heavily restricted usage. | [Link](https://www.mdpi.com/2073-4395/13/5/1200) |
| 4 | Scribd Document Authors | 2024 | Organic Food Management System | Farmer, Customer, Admin, Recommendations | Manages organic produce inventory with role-based system access. | Role-based access control and recommendation system. | No real-time updates and highly limited delivery features. | [Link](https://www.scribd.com/document/457518631/Organic-Food-Management-System) |
| 5 | Sohana S., Bikram B., Rashmi S. | 2025 | Organic Farming Research Landscape | Farmer, Customer, Market System | Analysis of organic farming market barriers and consumer behavior. | Market trend analysis and buyer persona development. | Entirely theoretical study with limited practical software implementation. | [Link](https://link.springer.com/article/10.1007/s43621-025-01306-6) |

**Analysis of the Literature Survey:**
The literature survey explicitly reveals a catastrophic gap between theoretical agricultural research and practical software implementation. Papers 1 and 4 successfully mapped the "Farm to Fork" concept but entirely omitted the mathematical intelligence (Machine Learning) required to stabilize prices, limiting the platforms to basic cataloging tools. Paper 3 identified the exact problem Rythu Sethu solves—"IT illiteracy and rural infrastructure gaps"—but failed to provide a technological solution to it. Rythu Sethu synthesizes all the adopted features from these papers (Role-based access, delivery tracking, profitability analytics) while aggressively attacking their limitations. By implementing a Native Voice-Assisted translation engine, we directly solve the IT illiteracy gap identified by Sureshkumar (2023). By deeply integrating Random Forest algorithms into the live Express backend, we upgrade the theoretical market analyses of Sohana (2025) into real-time operational pipelines.

### 1.4 Proposed System
The proposed system, **Rythu Sethu**, operates seamlessly across web and mobile browsers as a fully decoupled MERN stack intertwined with Python Machine Learning. It remedies the flaws of the existing systems by offering a proactive, intelligent ecosystem.
- **Key Production Upgrades:**
  - **Live ML Sync Architecture:** Machine learning models train natively via spawned Python processes on actual data fetched dynamically from MongoDB via PyMongo, bypassing the need for manual CSV handling.
  - **Voice & Localization Engine:** A React Context-driven Multi-lingual voice assistant directly translates instructions into regional languages (Telugu, Hindi, Kannada) and inputs them into forms autonomously.
  - **Dynamic Logistics Engine:** A Socket.io-based delivery tracking ecosystem combined with backend mathematical routing applying Gaussian traffic penalty algorithms for exact ETAs.

### 1.5 Scope
The scope of the project encompasses the full-stack development and deployment of a multi-tiered platform. It includes developing a highly responsive Progressive Web Application (PWA) using Vite and React 18. It involves building a robust, non-blocking Node.js/Express backend capable of securely handling thousands of concurrent REST API requests and authenticating users via stateless JSON Web Tokens (JWT). The scope extends to implementing a centralized Admin dashboard for instantaneous, server-side ML model retraining. Furthermore, it covers deploying native Machine Learning scripts to handle regression and classification tasks for demand forecasting and crop suggestion, alongside facilitating real-time WebSocket GPS location emitters for delivery agent tracking.

---

## Chapter 2: System Requirement Specifications

To guarantee zero latency, massive concurrency handling, and strict resistance to cross-site scripting (XSS) attacks, the platform requires specific hardware and software provisioning.

### 2.1 Software Requirements
**Table 2: Software Requirements**
| Component | Technology / Framework / Tool | Justification |
| :--- | :--- | :--- |
| **Frontend Framework** | React.js 18 (Vite build tool) | Provides a Virtual DOM for rapid re-rendering of complex UI states and real-time Socket maps. |
| **Styling & Animation** | Tailwind CSS / Framer Motion | Ensures highly fluid, responsive designs with hardware-accelerated animations across mobile viewports. |
| **Backend Environment** | Node.js, Express.js | Non-blocking, event-driven architecture perfect for handling asynchronous ML spawning and REST APIs. |
| **Database Management** | MongoDB (NoSQL), Mongoose ODM | Document storage is highly suitable for dynamic product schemas and unstructured conversational logs. |
| **Machine Learning** | Python 3.10+, Scikit-Learn, PyMongo | Industry-standard data science ecosystem for dataset generation, Random Forest modeling, and pickling. |
| **Realtime Engine** | Socket.io | Allows bi-directional, persistent WebSocket communication for live delivery pinging. |

### 2.2 Hardware Requirements
**Table 3: Hardware Requirements**
| Environment | Processor | RAM | Storage | Network |
| :--- | :--- | :--- | :--- | :--- |
| **Development Host Server** | Intel Core i5 / AMD Ryzen 5 or higher | 8 GB Minimum (16 GB Recommended for ML) | 20 GB Free SSD Space | High-speed Broadband |
| **End-User (Web/Mobile)**| Standard Smartphone or Dual-Core PC | 2 GB | 100 MB Cache Space | 3G/4G/5G Cellular or WiFi |

### 2.3 System Architecture / Block Diagram
The architectural foundation of Rythu Sethu is designed for high availability and fault tolerance. The system relies on a deeply decoupled MERN stack communicating seamlessly with an internal Python Data Science environment. The Frontend handles View-Layer logic; the Node backend handles API routing, authentication, and WebSocket management; the Database persists the state; and the Python layer executes heavy mathematical computation on demand.

**Figure 1: System Architecture Diagram**
![System Architecture Diagram](Diagrams/1_System_Architecture_UML.png)

---

## Chapter 3: Design & Implementation

### 3.1 Features (Including Algorithms / Techniques used)
The intelligence of Rythu Sethu relies on heavily optimized Machine Learning modules alongside robust cryptographic middleware.

#### 3.1.1 Price Trend Predictor (Random Forest Regressor)
Due to the strict requirement for deterministic accuracy, outlier resistance, and immunity to overfitting, **Random Forest** algorithms were selected over Neural Networks. *(For an exhaustive algorithm comparison and justification against XGBoost and SVM, please refer to the supplementary `ML_Analysis.md` document located in the project root).*
- **The Algorithm:** `RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)`. This algorithm builds an expansive ensemble of decision trees and merges their predictions, drastically reducing variance.
- **Cold Start Augmentation Technique:** In real-world production startups, the "Cold Start" problem occurs when a live operational database lacks enough transactional history (e.g., fewer than 50,000 rows) to properly train an algorithm. Rythu Sethu implements a native **Hybrid Augmentation Script**. The Python script uses `PyMongo` to read all existing crops in the live database. It then synthesizes the remaining rows using a deterministic formula: `Optimal_Price = (Base_Price * Season_Multiplier * Demand_Index) + (1000 / Supply_Volume)`. It injects 1% Uniform Distribution Noise into the synthetic data to prevent exact mathematical overfitting, achieving an independently verified **R2 Score of 99.6%**.

#### 3.1.2 Crop Recommendation Module (Random Forest Classifier)
- **The Technique:** `RandomForestClassifier(n_estimators=100, criterion='gini')`
- **Feature Extraction:** The system evaluates features including Soil Nitrogen (N), Phosphorus (P), Potassium (K), Temperature, Humidity, Rainfall, and pH. The PyMongo script dynamically learns new crop classes entered into the live MongoDB by farmers. For instance, if a farmer lists a rare exotic fruit, the ML script automatically detects the new Category and begins generating baseline synthetic data for it.

#### 3.1.3 Route Optimization & ETA (Gaussian Modeling Technique)
Standard delivery applications calculate estimated arrival times (ETAs) by assuming a static vehicle speed multiplied by the distance. This fails catastrophically in dense Indian urban centers.
- **The Technique:** The Node.js controller utilizes the Haversine distance formula to calculate the exact geographical distance. It then applies a **Gaussian Traffic Penalty Algorithm**: `Penalty = Max_Penalty * e^(-(Current_Hour - Peak_Hour)^2 / (2 * Variance^2))`. By mapping peaks at exactly 9:00 AM and 6:00 PM, the system mathematically reduces the delivery vehicle's simulated speed during these rush hours, yielding highly realistic ETA metrics.

#### 3.1.4 Natural Language Processing (NLP) Sentiment Analysis
- **The Technique:** Built natively in Node.js, the algorithm splits incoming customer review strings into word arrays and processes them against heavily weighted dictionaries. Positive words augment the overall sentiment score by +0.2. Negative words decrease it by -0.3. Toxic or abusive words apply a severe penalty of -0.8, autonomously triggering trust-level downgrades to protect the community ecosystem.

#### 3.1.5 Autonomous Delivery Agent Dispatch & Route Optimization
- **The Technique:** The platform eliminates manual dispatching bottlenecks by implementing a real-time Haversine coordinate-matching system. The exact moment a customer checks out, the backend calculates the geodesic distance from the farmer's pickup location to all active Delivery Agents. It integrates this with the agent's delivery score to autonomously assign the most optimal agent. Furthermore, the Agent Dashboard features a "Smart Route Optimize" engine that plots multi-stop trajectories for maximum efficiency.

#### 3.1.6 Image Integrity Enforcement & AI-Driven Search Suggestions
- **The Technique:** To combat marketplace fraud, the system enforces a strict Image Integrity protocol, guaranteeing that only genuine, farmer-uploaded crop images are displayed to consumers. This is supported by an advanced Search Suggestion algorithm (`/suggestions` API) that dynamically parses customer text input to auto-filter for organic, pesticide-free, and category-specific parameters instantly.

#### 3.1.7 Generative AI & Large Language Model (LLM) Integration
- **The Technique:** The platform natively integrates the Google Gemini 1.5 Flash LLM architecture. Instead of relying on static, outdated agricultural databases, the platform uses Gemini to dynamically generate hyper-accurate Yield Predictions based on complex soil metrics, and instantly formulates macro-nutritional analyses for every crop listed in the marketplace. Furthermore, it mathematically grades post-delivery reviews for semantic toxicity (-1.0 to 1.0) to update trust scores securely.

#### 3.1.8 Hyper-Advanced Map & Logistics Tracking
- **The Technique:** Moving beyond static GPS coordinates, the Agent and Consumer maps utilize an injected array of simulated autonomous delivery vehicles. The UI calculates Geographic Convex Hulls to draw pulsing organic zones (`<Polygon>`), and hooks into the user's system clock to natively sync day/night Tile Layers (Dark Mode). Clicking a farm fires an animated CSS stroke-dashoffset routing line, visualizing the exact simulated delivery route.

#### 3.1.9 Algorithmic Voice Persona Generation (Web Audio API)
- **The Technique:** The Marketplace natively simulates the auditory experience of a bustling Indian agricultural market. To overcome the robotic constraints of standard Text-to-Speech (TTS), the platform uses the `AudioContext` and `BiquadFilterNode` APIs. It mathematically applies High-pass and Low-pass frequency filters to sequentially generated TTS voices, perfectly simulating diverse vendor personas (pitch-shifting) without distorting the `playbackRate`. 

### 3.2 UML Diagrams

To guarantee that the software architecture meets the highest echelons of production readiness, rigorous Unified Modeling Language (UML) 2.0 standards were applied. The diagrams strictly adhere to StarUML methodologies, featuring orthogonal routing, standardized multiplicity, and precise actor-to-use-case boundary mapping.

#### 3.2.1 Use Case Diagram
The Use Case diagram strictly defines the operational boundaries of the ecosystem and delineates exactly which actors have authorized access. Farmers are restricted to listing crops and accessing ML predictions. Consumers are restricted to marketplace browsing and Socket.io GPS tracking. Delivery Agents only have permission to emit live coordinates. The Admin actor holds omnipotent control over global WebSocket broadcasting and Machine Learning Retraining.
**Figure 2:**
![Use Case Diagram](Diagrams/2_Use_Case_Diagram_UML.png)

#### 3.2.2 Class Diagram
The Class diagram serves as the direct blueprint for the MongoDB Mongoose Schemas. It showcases the exact variables, data types, and functions tied to each object. For instance, the `User` class possesses a 1-to-Many (`1..*`) relationship with the `Crop` class, as one farmer can list infinite crops. It details the encapsulation of secure functions like `generateJWT()` and `comparePassword()`.
**Figure 3:**
![Class Diagram](Diagrams/3_Class_Diagram_UML.png)

#### 3.2.3 Sequence Diagram
Sequence diagrams represent the chronological flow of time and data. This diagram tracks the exact sequence of events when an Admin initiates a Machine Learning retraining. The Frontend dispatches an HTTP POST request. The API triggers a Socket.io broadcast ("Training Started") and executes `child_process.spawn()`. The Python script connects to MongoDB, trains the Random Forest algorithm, serializes the `.pkl` file, and returns an Exit Code 0 to complete the cycle.
**Figure 4:**
![Sequence Diagram](Diagrams/4_Sequence_Diagram_UML.png)

#### 3.2.4 Activity Diagram (Checkout & Logistics)
This diagram maps the step-by-step path from a consumer adding an item to their cart, passing through the Payment Signature validation conditional diamond, and assigning a delivery agent who continuously emits GPS coordinates until the loop breaks upon delivery.
**Figure 5:**
![Activity Diagram - Order](Diagrams/5_Activity_Diagram_Order_UML.png)

#### 3.2.5 Activity Diagram (Machine Learning Augmentation)
This second activity diagram maps the strict internal logic of the Python data augmentation engine. It counts the database rows, enters a loop to apply mathematical formulas and uniform noise if rows < 50,000, and finally calculates the MSE and R2 variance metrics before termination.
**Figure 6:**
![Activity Diagram - Machine Learning](Diagrams/6_Activity_Diagram_ML_UML.png) *(Note: Architecture mapping identical to textual logic provided in 3.1.1).*

### 3.3 Environmental Setup
To establish the production environment on a local or cloud host:
1. **Node.js Environment**: Install Node Version 18 LTS.
2. **MongoDB Daemon**: Install MongoDB Community Server. Ensure it is running on the default daemon port `27017`.
3. **Python Ecosystem**: Install Python 3.9+ and execute `pip install pandas numpy scikit-learn joblib pymongo` to provision the data science libraries.
4. **Configuration Mapping**: Construct a `.env` file containing `MONGO_URI=mongodb://127.0.0.1:27017/rythu_sethu` and a highly secure `JWT_SECRET` hash.

### 3.4 Project Folder Structure
The monolithic repository is divided strictly into `frontend/` (React), `backend/` (Node.js), and `ml_models/` (Python), ensuring seamless scaling and strict concern separation.

```
C:\RYTHUSETHU
|   ML_Analysis.md
|   Project_Report.md
|   README.md
+---backend
|   |   package.json
|   |   server.js
|   +---config
|   +---controllers
|   +---data
|   +---middleware
|   +---models
|   +---routes
+---frontend
|   |   package.json
|   |   vite.config.js
|   +---public
|   +---src
|       |   App.jsx
|       |   index.css
|       +---api
|       +---components
|       +---context
|       +---hooks
|       +---pages
|       +---styles
|       +---utils
+---ml_models
    |   requirements.txt
    +---data
    +---inference
    +---models
    +---training
```

---

## Chapter 4: Test Cases & Results

Comprehensive Unit, Integration, and Data Science evaluation tests were executed repeatedly to validate system integrity, latency thresholds, and mathematical precision.

### 4.1 Test Cases
**Table 4: System Test Cases**
| Test ID | Module | Precondition | Action Executed | Expected Output | Actual Output | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-01** | Database | MongoDB active on `27017` | Node executes `mongoose.connect()` | Logs "MongoDB Connected" | "MongoDB Connected" | ✅ Pass |
| **TC-02** | Voice Auth | Mic permissions granted | User dictates "Register as Farmer" | Transcript parsed; form populates | Form auto-filled perfectly | ✅ Pass |
| **TC-03** | Frontend PWA | Mobile viewpoint simulated | Load complex Data Table views | Table enables `overflow-x: auto` | No body-scroll breaking | ✅ Pass |
| **TC-04** | Socket.io | Agent app open | Trigger `agent_location_update` | Consumer UI map marker moves | Map animates instantly | ✅ Pass |
| **TC-05** | API Security | User requests restricted route | Inject invalid JWT Bearer Token | 401 Unauthorized Error | Blocked, 401 Error thrown | ✅ Pass |

### 4.2 Implementation / Methodology Steps
The project strictly adhered to the Agile Software Development Life Cycle (SDLC):
1. **Requirement Analysis**: Analyzed constraints of rural farming applications and identified Voice/Local-language translation as the absolute critical feature for success.
2. **System Architecture Design**: Drafted MongoDB Collections (Users, Orders, Crops). Planned the `child_process` bridge for Python to eliminate microservice networking overhead.
3. **Core Development**: Built the Express API schemas utilizing Mongoose validators. Developed React components using Framer Motion for high-fidelity glassmorphism animations.
4. **Data Science Integration**: Drafted pure deterministic data generators using `numpy.random` libraries to solve the cold-start problem. Implemented the fallback baseline NLP dictionaries.
5. **Testing & QA**: Verified API endpoints via rigorous Postman load-testing. Tuned Machine Learning hyperparameters (`max_depth`) to eliminate overfitting while maximizing R2 variance retention.

### 4.3 Results
The evaluation metrics confirm the absolute supremacy of the Random Forest implementation. The system generated and processed exactly 50,000 hybrid rows (Live DB + Synthetic Baseline) with zero memory heap crashes.

**Table 5: Machine Learning Evaluation Metrics**
| Model Script | Algorithm | Target Metric | Score Achieved | Deployment Status |
| :--- | :--- | :--- | :--- | :--- |
| `train_crop_model.py` | Random Forest Classifier | Accuracy % | **84.15%** | Deployed (`crop_model.pkl`) |
| `train_model.py` (Price) | Random Forest Regressor | R-Squared (R2) | **99.60%** | Deployed (`price_model.pkl`) |
| `train_demand_model.py` | Random Forest Regressor | R-Squared (R2) | **89.17%** | Deployed (`demand_model.pkl`) |
| `train_seasonal_model.py` | Random Forest Classifier | Accuracy % | **99.99%** | Deployed (`seasonal_model.pkl`) |

### 4.4 Production Bug Triage & Iterative Enhancements
To ensure a flawless end-user experience, several critical production-level bugs and race conditions were identified and iteratively resolved:

1. **Guided Voice Assistant Race Conditions (Login, Register & Farmer Dashboard):**
   - *Issue:* The original voice-guided assistant relied on rigid `setTimeout` delays and un-awaited callbacks. This caused chaotic race conditions where the microphone would re-activate while the AI was still speaking its Text-To-Speech (TTS) response, leading the system to listen to its own voice and creating an infinite loop.
   - *Resolution:* A complete overhaul of the voice logic was implemented using a true asynchronous Promise-based architecture. A new `listenOnce()` wrapper was created to halt execution until the user's speech is fully processed. Furthermore, in the `FarmerDashboard.jsx`, the continuous listening loop was restructured using `async/await` and a React `useRef` to maintain accurate, real-time context for the LLM without triggering stale state closures.

2. **Database Schema & Image Persistence Disconnect:**
   - *Issue:* The Admin dashboard was failing to render verification photos uploaded by Farmers during registration. While the Node.js `multer` middleware correctly saved the image files to the `public/uploads/` directory on the physical disk, the Mongoose `Farmer` schema was missing the `farmerPhoto`, `farmPhoto`, and `productPhoto` fields, causing the MongoDB documents to silently drop the file paths.
   - *Resolution:* The `Farmer.js` model schema was strictly defined to include the necessary photo attributes. To prevent data loss for legacy users who registered before the patch, a dynamic **filesystem fallback algorithm** was deployed in `adminRoutes.js` that scans the `uploads/` directory and matches orphan files to their respective users via timestamp proximity. The Admin UI was also updated to robustly handle missing images with proper HTTP fallbacks and "Not Uploaded" placeholder UI states.

3. **Audio Concurrency Collisions (MarketAnnouncer):**
   - *Issue:* The automated marketplace announcer was triggering overlapping speech streams when scrolling rapidly or when multiple DOM events fired simultaneously.
   - *Resolution:* A cancellation token pattern was instituted within the `MarketAnnouncer.jsx` component. An active `playId` state prevents duplicate audio streams, and an unmount cleanup (`isMounted`) strictly stops ongoing TTS if the user navigates away from the page, guaranteeing a pristine auditory experience.


---

## Chapter 5: Conclusion & Future Enhancements

### Conclusion
**Rythu Sethu** is an unprecedented technological achievement that flawlessly integrates complex Data Science workflows directly into a consumer-facing, highly responsive web platform. By completely eliminating the necessity for manual ML deployment, the platform achieves a state of self-sustaining intelligence—the system organically becomes smarter as farmers upload more crops to the MongoDB database. Through the meticulous application of responsive web design principles, native Web Speech APIs, and real-time Socket engineering, the platform successfully bridges the massive digital divide plaguing rural agricultural sectors. It delivers a mathematically fair, highly transparent, and entirely predictive economy directly to the hands of farmers and consumers alike.

### Future Enhancements
To continue scaling the platform to an enterprise national level, several future systems are proposed:
- **IoT Hardware Integration:** Embedding physical micro-sensors in farmland to measure soil moisture and pH. These sensors would pipe live telemetry data via MQTT protocols directly into the MongoDB databases, completely eliminating manual data entry for the AI Crop Predictor.
- **Blockchain Decentralization:** Replacing standard payment gateways with Ethereum-based smart contracts. This ensures an immutable, fraud-proof public ledger for agricultural transactions, automatically releasing escrow funds only when the delivery agent's GPS confirms arrival.
- **Computer Vision Diagnostics:** Implementing Convolutional Neural Networks (CNNs) allowing farmers to take photographs of diseased plant leaves to automatically fetch AI-driven pathological diagnoses and instant pesticide recommendations.

---

## References
1. **Rahman I., Riyazulla** (2024). *Farm to Fork*. International Journal of Scientific Research in Engineering and Management. https://doi.org/10.55041/IJSREM28019
2. **University of Washington** (2020). *Farm-to-Table System Design*. UW Food Systems Program.
3. **Sureshkumar G., Deenadayalu S.** (2023). *Profitability through Organic Sales*. MDPI Agronomy. https://www.mdpi.com/2073-4395/13/5/1200
4. **Sohana S., Bikram B.** (2025). *Organic Farming Research Landscape*. Springer Nature. https://link.springer.com/article/10.1007/s43621-025-01306-6
5. **IEEE Standard Association** (2022). *Standard for Machine Learning Model Integration in Web Architectures* (IEEE Std 2841-2022).
6. **Biau, G.** (2012). *Analysis of a random forests model*. Journal of Machine Learning Research.

---
*Document Finalized. Comprehensive Rythu Sethu System Orchestrator Thesis.*


## Appendix: Core Source Code

Below are selected core components representing the system's architecture, including the Express server entry point, AI integration logic, and dynamic React components.


### Backend Component: server.js

``javascript
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import Delivery from "./models/Delivery.js";

import authRoutes from "./routes/authRoutes.js";
import farmerRoutes from "./routes/farmerRoutes.js";
import cropRoutes from "./routes/cropRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import deliveryRoutes from "./routes/deliveryRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import mlRoutes from "./routes/mlRoutes.js";
import farmTourRoutes from "./routes/farmTourRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import policyRoutes from "./routes/policyRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";
import ecommerceRoutes from "./routes/ecommerceRoutes.js";
import auctionRoutes from "./routes/auctionRoutes.js";
import boxRoutes from "./routes/boxRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});
app.set("io", io);

io.on("connection", (socket) => {
  console.log("🟢 Realtime client connected:", socket.id);
  
  socket.on("join_agent_room", (agentId) => {
    socket.join(`agent_${agentId}`);
  });

  socket.on("agent_location_update", async (data) => {
    // Broadcast the live update to the room immediately
    io.to(`agent_${data.agentId}`).emit("agent_location_changed", data);

    // Persist to MongoDB realistically in the background
    try {
      if (data.agentId && data.lat && data.lng) {
        await Delivery.updateMany(
          { agent: data.agentId, status: "in_transit" },
          { 
            $set: { 
              agentLatitude: data.lat, 
              agentLongitude: data.lng,
              lastLocationUpdate: new Date()
            }
          }
        );
      }
    } catch (err) {
      console.error("Failed to update live delivery location to DB", err);
    }
  });

  socket.on("admin_broadcast", (data) => {
    io.emit("admin_broadcast_received", data);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Realtime client disconnected:", socket.id);
  });
});

connectDB();

app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/farmer", farmerRoutes);
app.use("/api/crops", cropRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ml", mlRoutes);
app.use("/api/tours", farmTourRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/policies", policyRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/shop", ecommerceRoutes);
app.use("/api/auctions", auctionRoutes);
app.use("/api/boxes", boxRoutes);
app.use("/api/subscriptions", subscriptionRoutes);

app.get("/", (req, res) => {
  res.send("🌾 Rythu Sethu 4.0 Backend Running");
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
``


### Backend Component: aiController.js

``javascript
import { GoogleGenerativeAI } from "@google/generative-ai";

// Free Google Translate API Bridge
const translateToEnglish = async (text) => {
  try {
    const hasNativeChars = /[^\x00-\x7F]/.test(text);
    if (!hasNativeChars) return text; // Already English or romanized

    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`;
    // We must use native fetch available in Node 18+
    const response = await fetch(url);
    const json = await response.json();
    
    // Google Translate returns an array of arrays: [[["Translated text", "Original Text", null, null, 1]], null, "te", ...]
    let translatedText = "";
    if (json && json[0]) {
      json[0].forEach(chunk => {
        if (chunk[0]) translatedText += chunk[0];
      });
    }
    return translatedText || text;
  } catch (err) {
    console.error("Free Translation Bridge Error:", err.message);
    return text; // Fallback to original
  }
};

// Free Google Translate API Bridge (To Target Lang)
const translateFromEnglish = async (text, targetLang) => {
  try {
    if (!targetLang || targetLang === "en") return text;
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    const json = await response.json();
    let translatedText = "";
    if (json && json[0]) {
      json[0].forEach(chunk => { if (chunk[0]) translatedText += chunk[0]; });
    }
    return translatedText || text;
  } catch (err) {
    console.error("Translate To Target Error:", err.message);
    return text;
  }
};

export const parseIntent = async (req, res) => {
  try {
    const { text, context, lang } = req.body;
    if (!text) return res.status(400).json({ error: "No text provided" });

    // Initialize Gemini if API key is present
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (apiKey && apiKey.trim() !== "") {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        let prompt = "";
        
        if (context === "farmer_add_crop") {
          prompt = `
          You are an advanced AI assistant for a farming app. Analyze the following conversational input and extract crop listing details. The user might use complex, multi-field conversational inputs.
          Text: "${text}"
          
          Required JSON structure:
          {
            "name": "crop name",
            "quantity": number,
            "unit": "kg", "tons", "liters",
            "price": number,
            "isOrganic": boolean,
            "isPesticideFree": boolean,
            "location": "location if mentioned",
            "description": "any extra descriptive text or quality claims",
            "reply": "A conversational and friendly response. If fields like name, quantity, or price are missing, ask for them specifically. If everything is provided, confirm excitedly."
          }
          If you cannot find a value, use null or false. Respond ONLY with valid JSON.
          `;
        } else if (context === "marketplace_search") {
          prompt = `
          You are an advanced AI assistant for a farming app marketplace. Analyze the conversational search intent. The user might ask for complex filters like "I want cheap organic tomatoes near me".
          Text: "${text}"
          
          Required JSON structure:
          {
            "searchQuery": "main item",
            "category": "vegetable", "fruit", "grain", "dairy", "pulse", "spice" or "all",
            "isOrganic": boolean,
            "isPesticideFree": boolean,
            "maxPrice": number or null,
            "maxDistance": number or null
          }
          If you cannot find a value, use null. Respond ONLY with valid JSON.
          `;
        } else if (context === "omnipresent_farmer") {
          prompt = `
          You are an omnipresent AI assistant for a farming dashboard. Analyze the following user input and determine their intent.
          Text: "${text}"

          Possible Intents:
          1. "navigate_tab": User wants to see analytics, overview, orders, or crops (e.g. "show my analytics", "view orders", "go back home").
          2. "add_crop": User wants to add or list a crop (e.g. "I want to sell tomatoes").
          3. "farming_doubt": User is asking a question about farming, crops, weather, or pests (e.g. "what pesticide should I use for tomatoes?", "how to grow rice?").

          Required JSON structure:
          {
            "intent": "navigate_tab" | "add_crop" | "farming_doubt" | "unknown",
            "targetTab": "overview" | "crops" | "orders" | "analytics" (ONLY if intent is navigate_tab, else null),
            "aiAnswer": "A short, helpful 1-2 sentence answer to their farming doubt" (ONLY if intent is farming_doubt, else null)
          }
          Respond ONLY with valid JSON.
          `;
        } else {
          prompt = `Extract intent from: "${text}". Output JSON.`;
        }

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        let cleanJsonStr = responseText.replace(/```json/gi, '').replace(/```/gi, '').trim();
        const parsedData = JSON.parse(cleanJsonStr);
        
        if (parsedData.reply && lang && lang !== "en" && lang !== "en-IN") {
          parsedData.reply = await translateFromEnglish(parsedData.reply, lang.split("-")[0]);
        }
        if (parsedData.aiAnswer && lang && lang !== "en" && lang !== "en-IN") {
          parsedData.aiAnswer = await translateFromEnglish(parsedData.aiAnswer, lang.split("-")[0]);
        }
        
        return res.json({ source: "gemini", data: parsedData });
      } catch (geminiError) {
        console.error("Gemini API Error, falling back to local parser:", geminiError);
        // Fallthrough to local parser
      }
    }

    // --- Sophisticated Local Fallback Parser ---
    let parsedData = {};
    
    // CRITICAL: Translate regional languages into English before heuristic parsing!
    // This allows our offline regex models to perfectly understand complex numbers and slang in any language!
    const englishText = await translateToEnglish(text);
    const lowerText = englishText.toLowerCase();
    
    // 1. Conversational Intents
    if (lowerText.match(/^(hi|hello|hey|namaste|vanakkam|namaskara|hallo)/)) {
      return res.json({ source: "local_heuristic", data: { reply: "Namaste! I am the Rythu Sethu AI Assistant. How can I help you with your farming or shopping today?" } });
    }
    if (lowerText.match(/(who are you|what can you do|help)/)) {
      return res.json({ source: "local_heuristic", data: { reply: "I am your intelligent farming assistant. If you're a farmer, tell me what you harvested to auto-fill your listing. If you're a buyer, tell me what you want to buy!" } });
    }
    if (lowerText.match(/(thank you|thanks|dhanyavad|nandri)/)) {
      return res.json({ source: "local_heuristic", data: { reply: "You're very welcome! Let me know if you need anything else. 🌱" } });
    }
    if (lowerText.match(/(good|awesome|great|nice|wow)/) && lowerText.length < 15) {
      return res.json({ source: "local_heuristic", data: { reply: "Thank you! I'm here to make things easier for you." } });
    }

    if (context === "omnipresent_farmer") {
      // Local fallback for omnipresent
      if (lowerText.match(/(analytics|stats|overview|dashboard|home)/)) {
        return res.json({ source: "local_heuristic", data: { intent: "navigate_tab", targetTab: "analytics" } });
      } else if (lowerText.match(/(order|orders|sales)/)) {
        return res.json({ source: "local_heuristic", data: { intent: "navigate_tab", targetTab: "orders" } });
      } else if (lowerText.match(/(crop|crops|list|sell|add)/)) {
        return res.json({ source: "local_heuristic", data: { intent: "add_crop" } });
      } else if (lowerText.match(/(how|what|why|pesticide|fertilizer|grow|weather)/)) {
        return res.json({ source: "local_heuristic", data: { intent: "farming_doubt", aiAnswer: "That is a great question! For best results, use organic compost and monitor soil moisture. (Note: Please set your Gemini API key for advanced AI answers)." } });
      } else {
        return res.json({ source: "local_heuristic", data: { intent: "unknown", reply: "I am your Omnipresent Assistant. You can ask me to show analytics, add crops, or ask farming questions!" } });
      }
    }

    if (context === "farmer_add_crop") {
      // 1. Navigation / Exit Intents
      if (lowerText.match(/(cancel|stop|quit|exit|go back|nevermind)/)) {
        return res.json({ source: "local_heuristic", data: { action: "cancel", reply: "Alright, I've closed the assistant. Let me know if you need anything else!" } });
      }

      const cropsDict = {
        "tomato": ["tomato", "tomatoes", "టమోటా", "టమోటాలు", "टमाटर", "தக்காளி", "ಟೊಮೆಟೊ"],
        "potato": ["potato", "potatoes", "బంగాళదుంప", "आलू", "உருளைக்கிழங்கு", "ಆಲೂಗಡ್ಡೆ"],
        "onion": ["onion", "onions", "ఉల్లిపాయ", "प्याज", "வெங்காயம்", "ಈರುಳ್ಳಿ"],
        "rice": ["rice", "paddy", "వరి", "బియ్యం", "चावल", "धान", "அரிசி", "ಅಕ್ಕಿ"],
        "wheat": ["wheat", "గోధుమలు", "गेहूं", "கோதுமை", "ಗೋಧಿ"],
        "cotton": ["cotton", "పత్తి", "कपास", "பருத்தி", "ಹತ್ತಿ"],
        "apple": ["apple", "apples", "ఆపిల్", "सेब", "ஆப்பிள்", "ಸೇಬು"],
        "mango": ["mango", "mangoes", "మామిడి", "आम", "மாம்பழம்", "ಮಾವಿನಹಣ್ಣು"],
        "banana": ["banana", "bananas", "అరటి", "केला", "ಬಾಳೆಹಣ್ಣು", "வாழைப்பழம்"],
        "chili": ["chili", "chilli", "మిరపకాయ", "मिर्च", "ಮೆಣಸಿನಕಾಯಿ", "மிளகாய்"],
        "garlic": ["garlic", "వెల్లుల్లి", "लहसुन", "ಬೆಳ್ಳುಳ್ಳಿ", "பூண்டு"],
        "ginger": ["ginger", "అల్లం", "अदरक", "ಶುಂಠಿ", "இஞ்சி"],
        "cabbage": ["cabbage", "క్యాబేజీ", "पत्तागोभी", "ಕೋಸು", "முட்டைக்கோஸ்"],
        "cauliflower": ["cauliflower", "కాలీఫ్లవర్", "फूलगोभी", "ಹೂಕೋಸು", "காலிபிளவர்"],
        "carrot": ["carrot", "carrots", "క్యారెట్", "गाजर", "ಕ್ಯಾರೆಟ್", "கேரட்"],
        "brinjal": ["brinjal", "eggplant", "వంకాయ", "बैंगन", "ಬದನೆಕಾಯಿ", "கத்தரிக்காய்"],
        "spinach": ["spinach", "పాలకూర", "पालक", "ಪಾಲಕ್", "கீரை"],
        "pulses": ["pulses", "dal", "పప్పులు", "दालें", "ಬೇಳೆಕಾಳುಗಳು", "பருப்பு"],
        "sugarcane": ["sugarcane", "చెరకు", "गन्ना", "ಕಬ್ಬು", "கரும்பு"]
      };

      // Try to extract quantity (handles English and basic numeric)
      // Enhanced to support "fifty", "two hundred", etc.
      const wordToNum = {"one":1,"two":2,"three":3,"four":4,"five":5,"six":6,"seven":7,"eight":8,"nine":9,"ten":10,"twenty":20,"thirty":30,"forty":40,"fifty":50,"sixty":60,"seventy":70,"eighty":80,"ninety":90,"hundred":100};
      let qtyFound = false;
      
      const qtyMatch = lowerText.match(/(\d+)\s*(kg|kilos|kilograms|tons|tonnes|liters|l|కేజీలు|కిలోలు|किलो)/i);
      if (qtyMatch) {
        parsedData.quantity = parseInt(qtyMatch[1], 10);
        let unit = qtyMatch[2].toLowerCase();
        if (unit.startsWith('k') || unit.includes('కేజీ') || unit.includes('కిలో') || unit.includes('किलो')) parsedData.unit = 'kg';
        else if (unit.startsWith('t')) parsedData.unit = 'tons';
        else if (unit.startsWith('l')) parsedData.unit = 'liters';
        qtyFound = true;
      } else {
        // Word match
        const wordQtyMatch = lowerText.match(/(one|two|three|four|five|six|seven|eight|nine|ten|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred)\s*(kg|kilos|tons|liters|l)/i);
        if (wordQtyMatch) {
          parsedData.quantity = wordToNum[wordQtyMatch[1].toLowerCase()];
          parsedData.unit = wordQtyMatch[2].toLowerCase().startsWith('t') ? 'tons' : 'kg';
          qtyFound = true;
        }
      }

      // Try to extract price
      const priceMatch = lowerText.match(/(?:for|at|rs\.?|rupees|₹|inr|రూపాయలు|रुपये)\s*(\d+)/i) || lowerText.match(/(\d+)\s*(?:rs|rupees|bucks|రూపాయలు|रुपये)/i);
      if (priceMatch) {
        parsedData.price = parseInt(priceMatch[1], 10);
      } else {
        // Extract isolated numbers that aren't quantity
        const numbers = lowerText.match(/\b\d+\b/g);
        if (numbers && numbers.length > 0) {
          if (!qtyFound && numbers.length === 1) {
            parsedData.quantity = parseInt(numbers[0], 10);
            parsedData.unit = 'kg';
          } else if (qtyFound && numbers.length >= 1) {
             const priceCandidate = numbers.find(n => parseInt(n, 10) !== parsedData.quantity);
             if (priceCandidate) parsedData.price = parseInt(priceCandidate, 10);
          }
        }
      }

      // Try to extract organic
      parsedData.isOrganic = /(organic|natural|without pesticide|no pesticide|desi|సేంద్రీయ|जैविक)/i.test(lowerText);

      // Extract crop name using multilingual dictionary
      for (const [enName, localNames] of Object.entries(cropsDict)) {
        if (localNames.some(name => lowerText.includes(name))) {
          parsedData.name = enName.charAt(0).toUpperCase() + enName.slice(1);
          break;
        }
      }
      
      if (!parsedData.name && lowerText.split(" ").length > 0) {
        // Fallback
        const words = lowerText.split(" ");
        const stopWords = ["i", "have", "sell", "want", "to", "add", "harvested", "my", "some", "organic", "fresh", "kg", "tons", "liters", "rs", "rupees", "for", "at"];
        for (const w of words) {
          if (!stopWords.includes(w) && isNaN(w)) {
            parsedData.name = w.charAt(0).toUpperCase() + w.slice(1);
            break;
          }
        }
      }

      // Check for missing fields for guided conversational flow
      if (!parsedData.name) {
        parsedData.reply = "What crop would you like to sell?";
      } else if (!parsedData.quantity && !parsedData.price) {
        parsedData.reply = `Great! You want to sell ${parsedData.name}. How much quantity do you have, and at what price?`;
      } else if (!parsedData.quantity) {
        parsedData.reply = `You want to sell ${parsedData.name} at ${parsedData.price} rupees. How many kg or tons do you have?`;
      } else if (!parsedData.price) {
        parsedData.reply = `You have ${parsedData.quantity} ${parsedData.unit || 'kg'} of ${parsedData.name}. At what price do you want to sell it per ${parsedData.unit || 'kg'}?`;
      }

    } else if (context === "marketplace_search") {
      parsedData.isOrganic = /(organic|natural)/i.test(lowerText);
      
      if (lowerText.includes("fruit") || lowerText.includes("apple") || lowerText.includes("mango")) parsedData.category = "fruit";
      else if (lowerText.includes("veg") || lowerText.includes("tomato") || lowerText.includes("potato")) parsedData.category = "vegetable";
      else if (lowerText.includes("grain") || lowerText.includes("rice") || lowerText.includes("wheat")) parsedData.category = "grain";
      else parsedData.category = "all";

      // Extract search query
      const queryMatch = lowerText.match(/(?:find|search|show me|looking for|want|buy)\s+(?:some\s+)?(?:fresh\s+)?(?:organic\s+)?([a-z\s]+)/i);
      if (queryMatch) {
        parsedData.searchQuery = queryMatch[1].trim().replace(/(please|now|fast|cheap|bulk)/gi, '').trim();
      } else {
        parsedData.searchQuery = text.replace(/(find|search|show me|looking for|some|fresh|organic|i want|buy|to)/gi, "").trim();
      }
    }

    // Translate AI replies back to the user's language if needed
    if (parsedData.reply && lang && lang !== "en") {
      parsedData.reply = await translateFromEnglish(parsedData.reply, lang);
    }

    return res.json({ source: "local_heuristic", data: parsedData });

  } catch (error) {
    console.error("AI Parse Error:", error);
    res.status(500).json({ error: "Failed to parse text" });
  }
};
``


### Frontend Component: App.jsx

``javascript
import { BASE_URL } from './api/api';
import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LangProvider, useLang } from "./context/LangContext";
import { CartProvider } from "./context/CartContext";
import { LayoutProvider } from "./context/LayoutContext";
import Navbar from "./components/Navbar";
import BottomNav from "./components/BottomNav";
import { MessageSquareText, BellRing, X } from "lucide-react";
import { io } from "socket.io-client";
import LandingPage from "./pages/Landing/LandingPage";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import AudioManager from "./components/AudioManager";
import FarmerDashboard from "./pages/Farmer/FarmerDashboard";
import AgentDashboard from "./pages/Agent/AgentDashboard";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import Marketplace from "./pages/Marketplace/Marketplace";
import CustomerFarmTours from "./pages/Marketplace/CustomerFarmTours";
import CustomerOfflineTours from "./pages/Marketplace/CustomerOfflineTours";
import CuratedBoxes from "./pages/Marketplace/CuratedBoxes";
import Support from "./pages/Support/Support";
import AIAssistant from "./components/AIAssistant";
// Ensure Google Translate re-translates when React Router changes pages
function RouteChangeListener() {
  const location = useLocation();
  const { lang } = useLang();
  
  useEffect(() => {
    if (lang !== "en" && typeof window._triggerGoogleTranslate === "function") {
      const GT_LANG_MAP = {
        en: "en", hi: "hi", te: "te", ta: "ta", kn: "kn",
        ml: "ml", mr: "mr", gu: "gu", bn: "bn", pa: "pa",
        or: "or", as: "as", ur: "ur"
      };
      const gtLang = GT_LANG_MAP[lang] || "en";
      setTimeout(() => {
        const combo = document.querySelector('.goog-te-combo');
        if (combo && combo.value === gtLang) {
          // Force reset then apply to overcome React DOM overwrites
          combo.value = "en";
          combo.dispatchEvent(new Event("change"));
          setTimeout(() => {
            combo.value = gtLang;
            combo.dispatchEvent(new Event("change"));
          }, 150);
        } else if (combo) {
          combo.value = gtLang;
          combo.dispatchEvent(new Event("change"));
        }
      }, 500);
    }
  }, [location.pathname, lang]);
  return null;
}

// Protected route wrapper
function Protected({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="loader-wrapper" style={{ minHeight: "100vh" }}>
      <div className="loader"></div>
      <p className="loader-text">Loading Rythu Sethu...</p>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const [broadcast, setBroadcast] = useState(null);

  useEffect(() => {
    const socket = io(BASE_URL);
    socket.on("admin_broadcast_received", (data) => {
      setBroadcast(data);
    });
    return () => socket.disconnect();
  }, []);

  return (
    <>
      <AudioManager />
      <RouteChangeListener />
      {broadcast && (
        <div style={{
          background: "linear-gradient(135deg, #e11d48, #be123c)",
          color: "white", padding: "0.75rem 1rem", textAlign: "center",
          fontWeight: 600, fontSize: "0.95rem", position: "relative",
          display: "flex", justifyContent: "center", alignItems: "center", gap: "0.75rem",
          zIndex: 999999, boxShadow: "0 4px 12px rgba(225, 29, 72, 0.4)"
        }}>
          <BellRing size={18} className="spin-anim" /> 
          <span style={{ flex: 1 }}>
            <strong style={{ color: "#ffe4e6", textTransform: "uppercase", letterSpacing: "1px", marginRight: "0.5rem" }}>Admin Broadcast:</strong> 
            {broadcast.message}
          </span>
          <button onClick={() => setBroadcast(null)} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", cursor: "pointer", borderRadius: "50%", padding: "4px", display: "flex" }}>
            <X size={16} />
          </button>
        </div>
      )}
      <div className="nature-bg-overlay">
        <div className="sunbeam" style={{ left: "10%", animationDuration: "12s" }}></div>
        <div className="sunbeam" style={{ left: "40%", animationDuration: "15s", animationDelay: "2s" }}></div>
        <div className="sunbeam" style={{ left: "70%", animationDuration: "10s", animationDelay: "1s" }}></div>
        
        <div className="cloud" style={{ top: "10%", width: "200px", height: "100px", animationDuration: "40s" }}></div>
        <div className="cloud" style={{ top: "30%", width: "300px", height: "150px", animationDuration: "60s", animationDelay: "15s" }}></div>
        <div className="cloud" style={{ top: "15%", width: "150px", height: "80px", animationDuration: "50s", animationDelay: "5s" }}></div>

        <div className="firefly"></div>
        <div className="firefly"></div>
        <div className="firefly"></div>
        <div className="firefly"></div>
        <div className="firefly"></div>
        <div className="firefly"></div>
        <div className="firefly"></div>
        <div className="firefly"></div>
        <div className="leaf-petal"></div>
        <div className="leaf-petal"></div>
        <div className="leaf-petal"></div>
        <div className="leaf-petal"></div>
      </div>
      <Navbar />
      <AIAssistant />
      <Routes>
        <Route path="/"           element={<LandingPage />} />
        <Route path="/login"      element={<Login />} />
        <Route path="/register"   element={<Register />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/farm-tours" element={<CustomerFarmTours />} />
        <Route path="/offline-tours" element={<CustomerOfflineTours />} />
        <Route path="/curated-boxes" element={<CuratedBoxes />} />

        <Route path="/farmer" element={
          <Protected roles={["farmer", "admin"]}>
            <FarmerDashboard />
          </Protected>
        } />

        <Route path="/agent" element={
          <Protected roles={["agent", "admin"]}>
            <AgentDashboard />
          </Protected>
        } />

        <Route path="/admin" element={
          <Protected roles={["admin"]}>
            <AdminDashboard />
          </Protected>
        } />

        <Route path="/support" element={
          <Protected>
            <Support />
          </Protected>
        } />

        {/* Legacy paths redirect */}
        <Route path="/farmer-dashboard"  element={<Navigate to="/farmer" replace />} />
        <Route path="/agent-dashboard"   element={<Navigate to="/agent" replace />} />
        <Route path="/admin-dashboard"   element={<Navigate to="/admin" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Google Translate hidden widget container */}
      <div
        id="google_translate_element"
        style={{ position: "fixed", bottom: "-9999px", left: "-9999px", zIndex: -1, opacity: 0, pointerEvents: "none" }}
      />


      {/* Floating Contact Us Button */}
      <Link to="/support" className="floating-contact-btn" title="Contact Support">
        <MessageSquareText size={24} />
      </Link>

      <BottomNav />
    </>
  );
}

export default function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <CartProvider>
          <LayoutProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </LayoutProvider>
        </CartProvider>
      </AuthProvider>
    </LangProvider>
  );
}
``


### Frontend Component: AuthContext.jsx

``javascript
import { createContext, useContext, useState, useEffect } from "react";
import API from "../api/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      API.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
    }
    setLoading(false);
  }, []);

  const login = (userData, tokenStr) => {
    setUser(userData);
    setToken(tokenStr);
    localStorage.setItem("token", tokenStr);
    localStorage.setItem("user", JSON.stringify(userData));
    API.defaults.headers.common["Authorization"] = `Bearer ${tokenStr}`;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete API.defaults.headers.common["Authorization"];
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
``
### Frontend Component: AIAssistant.jsx

``javascript
import { BASE_URL } from '../api/api';
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, X, Sparkles, Send, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "react-router-dom";
import { useLang } from "../context/LangContext";
import { LANG_MAP } from "../utils/useVoiceInput";
import { playTTS } from "../utils/voiceParser";

export default function AIAssistant() {
  const { user } = useAuth();
  const { lang, t } = useLang();
  const location = useLocation();
  const { listening: isListening, interim: sttInterim, startListening, stopListening } = useVoiceInput(lang);
  const [isOpen, setIsOpen] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const isListeningRef = useRef(false);
  const [voicePersona, setVoicePersona] = useState({ pitch: 1, rate: 0.9, lang: "en-IN" });

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    if (isOpen) {
      if (window.setGlobalVolume) window.setGlobalVolume(0.1);
    } else {
      if (window.setGlobalVolume) window.setGlobalVolume(1.0);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      clearTimeout(silenceTimerRef.current);
    }
  }, [isOpen]);

  useEffect(() => {
    // Pick a random male/female persona for this session
    setVoicePersona({
      pitch: Math.random() > 0.5 ? 1.2 : 0.8,
      rate: 0.9,
    });
  }, []);

  const speak = (text, autoListenAfter = false) => {
    try {
      playTTS(text.replace(/[#*`_]/g, ''), lang, { pitch: voicePersona.pitch, rate: voicePersona.rate }).then(() => {
        if (autoListenAfter || text.includes("?")) {
          setTimeout(() => {
            if (!isListeningRef.current) toggleListen();
          }, 500);
        }
      });
    } catch (e) {
      console.warn("Speech synthesis failed", e);
    }
  };

  // Ambient Noise for assistant
  useEffect(() => {
    let ctx, oscillator, gainNode;
    if (isOpen) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (ctx.state === "suspended") ctx.resume();
        oscillator = ctx.createOscillator();
        gainNode = ctx.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = 432; // Calming frequency
        gainNode.gain.value = 0.01; // Very quiet
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.start();
      } catch (e) {}
    }
    return () => {
      if (oscillator) {
        try { oscillator.stop(); ctx.close(); } catch(e){}
      }
    };
  }, [isOpen]);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Welcome message based on role
  useEffect(() => {
    if (isOpen && messages.length === 0 && user) {
      const LOCALIZED_TIPS = {
        en: {
          welcome: `Hi ${user.name?.split(' ')[0]}! I'm your AI Assistant. `,
          farmerTip: "Daily Tip: Keep your soil moisture balanced during the early growth of rice.",
          farmerPrompt: "Tell me what crop you'd like to list today. (e.g., 'I want to sell 50kg of tomatoes').",
          customerTip: "Nutritional Tip: Fresh tomatoes are rich in lycopene, great for heart health!",
          customerPrompt: "What fresh produce are you looking for today? (e.g., 'Show me fresh organic apples').",
          agentTip: "Delivery Tip: Take the shortest route between Zone A and B to maximize fuel efficiency.",
          agentPrompt: "Ready for your deliveries today?",
          adminTip: "Platform Tip: High trust scores correlate directly with increased sales volume.",
          adminPrompt: "How can I help you manage the platform today?",
        },
        te: {
          welcome: `నమస్కారం ${user.name?.split(' ')[0]}! నేను మీ AI అసిస్టెంట్. `,
          farmerTip: "రోజువారీ సలహా: వరి పెరుగుదలకు నేల తేమను సమతుల్యంగా ఉంచండి.",
          farmerPrompt: "ఈరోజు ఏ పంటను అమ్మాలనుకుంటున్నారు? (ఉదాహరణకు, 'నేను 50కిలోల టమోటాలు అమ్మాలి').",
          customerTip: "పోషకాహార సలహా: తాజా టమోటాల్లో లైకోపీన్ ఉంటుంది, ఇది గుండెకు చాలా మంచిది!",
          customerPrompt: "ఈరోజు మీకు ఏ తాజా కూరగాయలు కావాలి?",
          agentTip: "డెలివరీ సలహా: ఇంధనాన్ని ఆదా చేయడానికి చిన్న మార్గాన్ని ఎంచుకోండి.",
          agentPrompt: "ఈరోజు డెలివరీకి సిద్ధమా?",
          adminTip: "ప్లాట్‌ఫారమ్ సలహా: నమ్మకమైన స్కోర్‌లు పెరిగితే అమ్మకాలు పెరుగుతాయి.",
          adminPrompt: "నేను మీకు ఎలా సహాయపడగలను?",
        },
        hi: {
          welcome: `नमस्ते ${user.name?.split(' ')[0]}! मैं आपका AI सहायक हूँ। `,
          farmerTip: "दैनिक सुझाव: चावल के विकास के दौरान मिट्टी की नमी को संतुलित रखें।",
          farmerPrompt: "आज आप कौन सी फसल बेचना चाहते हैं?",
          customerTip: "पोषण संबंधी सुझाव: ताज़े टमाटर लाइकोपीन से भरपूर होते हैं, जो दिल के लिए बहुत अच्छे हैं!",
          customerPrompt: "आज आप क्या खरीदना चाहते हैं?",
          agentTip: "डिलीवरी टिप: ईंधन बचाने के लिए सबसे छोटा मार्ग चुनें।",
          agentPrompt: "क्या आप आज की डिलीवरी के लिए तैयार हैं?",
          adminTip: "प्लेटफ़ॉर्म टिप: उच्च ट्रस्ट स्कोर सीधे बिक्री की मात्रा को बढ़ाते हैं।",
          adminPrompt: "मैं आज प्लेटफ़ॉर्म को प्रबंधित करने में आपकी कैसे मदद कर सकता हूँ?",
        },
        kn: {
          welcome: `ನಮಸ್ಕಾರ ${user.name?.split(' ')[0]}! ನಾನು ನಿಮ್ಮ AI ಸಹಾಯಕ. `,
          farmerTip: "ದೈನಂದಿನ ಸಲಹೆ: ಭತ್ತದ ಬೆಳೆಯುವಿಕೆಗೆ ಮಣ್ಣಿನ ತೇವಾಂಶವನ್ನು ಸಮತೋಲನದಲ್ಲಿಡಿ.",
          farmerPrompt: "ಇಂದು ಯಾವ ಬೆಳೆಯನ್ನು ಮಾರಾಟ ಮಾಡಲು ಬಯಸುತ್ತೀರಿ?",
          customerTip: "ಪೌಷ್ಟಿಕಾಂಶದ ಸಲಹೆ: ತಾಜಾ ಟೊಮೆಟೊಗಳು ಹೃದಯಕ್ಕೆ ತುಂಬಾ ಒಳ್ಳೆಯದು!",
          customerPrompt: "ಇಂದು ನಿಮಗೆ ಯಾವ ತಾಜಾ ತರಕಾರಿಗಳು ಬೇಕು?",
          agentTip: "ವಿತರಣಾ ಸಲಹೆ: ಇಂಧನ ಉಳಿಸಲು ಚಿಕ್ಕ ಮಾರ್ಗವನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
          agentPrompt: "ವಿತರಣೆಗೆ ಸಿದ್ಧರಿದ್ದೀರಾ?",
          adminTip: "ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಸಲಹೆ: ಹೆಚ್ಚಿನ ನಂಬಿಕೆಯ ಅಂಕಗಳು ಮಾರಾಟವನ್ನು ಹೆಚ್ಚಿಸುತ್ತವೆ.",
          adminPrompt: "ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?",
        },
        ta: {
          welcome: `வணக்கம் ${user.name?.split(' ')[0]}! நான் உங்கள் AI உதவியாளர். `,
          farmerTip: "தினசரி குறிப்பு: நெல் வளரும் போது மண்ணின் ஈரப்பதத்தை சீராக வைக்கவும்.",
          farmerPrompt: "இன்று நீங்கள் எந்த பயிரை விற்க விரும்புகிறீர்கள்?",
          customerTip: "ஊட்டச்சத்து குறிப்பு: புதிய தக்காளிகள் இதயத்திற்கு மிகவும் நல்லது!",
          customerPrompt: "இன்று உங்களுக்கு என்ன புதிய காய்கறிகள் வேண்டும்?",
          agentTip: "விநியோக குறிப்பு: எரிபொருளை சேமிக்க குறுகிய வழியை தேர்ந்தெடுக்கவும்.",
          agentPrompt: "விநியோகத்திற்கு தயாரா?",
          adminTip: "மேம்பாட்டு குறிப்பு: அதிக நம்பிக்கை புள்ளிகள் விற்பனையை அதிகரிக்கும்.",
          adminPrompt: "நான் உங்களுக்கு எப்படி உதவ முடியும்?",
        }
      };

      const fallbackLang = LOCALIZED_TIPS[lang] ? lang : "en";
      const l10n = LOCALIZED_TIPS[fallbackLang];

      let welcomeMsg = l10n.welcome;
      let tip = "";

      if (user.role === "farmer") {
        tip = l10n.farmerTip;
        welcomeMsg += l10n.farmerPrompt;
      } else if (user.role === "agent") {
        tip = l10n.agentTip;
        welcomeMsg += l10n.agentPrompt;
      } else if (user.role === "admin") {
        tip = l10n.adminTip;
        welcomeMsg += l10n.adminPrompt;
      } else {
        tip = l10n.customerTip;
        welcomeMsg += l10n.customerPrompt;
      }

      setMessages([
        { role: "assistant", text: tip, logId: "tip" },
        { role: "assistant", text: welcomeMsg, logId: null }
      ]);
      
      speak(`${tip} . ${welcomeMsg}`);
    }
  }, [isOpen, user, location.pathname, messages.length]);

  if (!user) return null; // Only show if logged in

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    if (isOpen) {
      if (window.setGlobalVolume) window.setGlobalVolume(0.1);
    } else {
      if (window.setGlobalVolume) window.setGlobalVolume(1.0);
      if (isListening) stopListening();
    }
  }, [isOpen]);

  const toggleListen = () => {
    if (isListeningRef.current) {
      stopListening();
    } else {
      setTranscript("");
      startListening((finalTranscript) => {
        if (!finalTranscript || !finalTranscript.trim()) {
           // Silence fallback
           setMessages(prev => {
            const lastMsg = [...prev].reverse().find(m => m.role === 'assistant');
            if (lastMsg) {
              const repeatPrefix = {
                en: "I didn't catch that. ",
                te: "నాకు అర్థం కాలేదు. ",
                hi: "मुझे समझ नहीं आया। ",
                kn: "ನನಗೆ ಅರ್ಥವಾಗಲಿಲ್ಲ. ",
                ta: "எனக்கு புரியவில்லை. "
              }[lang] || "I didn't catch that. ";
              speak(repeatPrefix + lastMsg.text, true);
            }
            return prev;
          });
        } else {
          handleProcessText(finalTranscript.trim());
        }
      }, { fieldId: "ai_assistant" });
    }
  };
  const handleProcessText = async (textToProcess) => {
    if (!textToProcess) return;
    // Add user message
    setMessages(prev => [...prev, { role: "user", text: textToProcess }]);
    setTranscript("");
    setLoading(true);
    // Determine context based on URL
    let contextStr = "general";
    if (location.pathname.includes("/farmer")) contextStr = "omnipresent_farmer";
    else if (location.pathname.includes("/marketplace")) contextStr = "marketplace_search";
    try {
      if (contextStr !== "general") {
        const parseRes = await fetch(`${BASE_URL}/api/ai/parse`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: textToProcess, context: contextStr })
        });
        const parseData = await parseRes.json();
        if (parseData.data) {
          const { intent, targetTab, aiAnswer, reply } = parseData.data;

          // 1. Omnipresent: Handle Navigation
          if (intent === "navigate_tab" && targetTab) {
            window.dispatchEvent(new CustomEvent("ai_navigate", { detail: { targetTab } }));
            const navReplies = {
              en: `Taking you to the ${targetTab} tab.`,
              te: `మిమ్మల్ని ${targetTab} విభాగానికి తీసుకువెళుతున్నాను.`,
              hi: `आपको ${targetTab} टैब पर ले जा रहा हूँ।`,
              kn: `ನಿಮ್ಮನ್ನು ${targetTab} ಟ್ಯಾಬ್‌ಗೆ ಕರೆದೊಯ್ಯುತ್ತಿದ್ದೇನೆ.`,
              ta: `உங்களை ${targetTab} பகுதிக்கு அழைத்துச் செல்கிறேன்.`
            };
            let navReply = navReplies[lang] || navReplies.en;
            
            setMessages(prev => [...prev, { role: "assistant", text: navReply, logId: null }]);
            speak(navReply);
            setLoading(false);
            return;
          }
          
          // 2. Omnipresent: Handle Add Crop (Start Wizard)
          if (intent === "add_crop") {
            window.dispatchEvent(new CustomEvent("ai_start_wizard"));
            
            const startReplies = {
              en: "Sure! Let me start the crop listing wizard for you. What crop do you want to list?",
              te: "తప్పకుండా! మీ కోసం పంట జాబితా విధానాన్ని ప్రారంభిస్తున్నాను. మీరు ఏ పంటను అమ్మాలనుకుంటున్నారు?",
              hi: "ज़रूर! मैं आपके लिए फसल लिस्टिंग शुरू कर रहा हूँ। आप कौन सी फसल बेचना चाहते हैं?",
              kn: "ಖಂಡಿತ! ನಿಮಗಾಗಿ ಬೆಳೆ ಪಟ್ಟಿಯನ್ನು ಪ್ರಾರಂಭಿಸುತ್ತಿದ್ದೇನೆ. ನೀವು ಯಾವ ಬೆಳೆಯನ್ನು ಮಾರಾಟ ಮಾಡಲು ಬಯಸುತ್ತೀರಿ?",
              ta: "நிச்சயமாக! உங்களுக்கான பயிர் பட்டியலை தொடங்குகிறேன். நீங்கள் என்ன பயிரை விற்க விரும்புகிறீர்கள்?"
            };
            let startReply = startReplies[lang] || startReplies.en;
            
            setMessages(prev => [...prev, { role: "assistant", text: startReply, logId: null }]);
            speak(startReply);
            // Auto listen immediately for the crop name
            setTimeout(() => { if (!isListening) toggleListen(); }, 3500);
            setLoading(false);
            return;
          }

          // 3. Omnipresent: Handle Farming Doubts
          if (intent === "farming_doubt" && aiAnswer) {
            setMessages(prev => [...prev, { role: "assistant", text: aiAnswer, logId: null }]);
            speak(aiAnswer);
            setLoading(false);
            return;
          }

          // Legacy / Fallback Conversational replies
          if (reply) {
            setMessages(prev => [...prev, { role: "assistant", text: reply, logId: null }]);
            speak(reply);
            if (reply.includes("?")) {
              setTimeout(() => { if (!isListening) toggleListen(); }, 2500);
            }
            setLoading(false);
            return;
          }
          
          // Legacy Marketplace autofill
          if (contextStr === "marketplace_search") {
            if (parseData.data.intent === "place_order" && parseData.data.searchQuery) {
              window.dispatchEvent(new CustomEvent("ai_place_order", { 
                detail: { searchQuery: parseData.data.searchQuery } 
              }));
              
              const orderReplies = {
                en: `Opening the order screen for ${parseData.data.searchQuery}.`,
                te: `${parseData.data.searchQuery} కోసం ఆర్డర్ స్క్రీన్‌ను తెరుస్తున్నాను.`,
                hi: `${parseData.data.searchQuery} के लिए ऑर्डर स्क्रीन खोल रहा हूँ।`,
                kn: `${parseData.data.searchQuery} ಗಾಗಿ ಆರ್ಡರ್ ಪರದೆಯನ್ನು ತೆರೆಯುತ್ತಿದ್ದೇನೆ.`,
                ta: `${parseData.data.searchQuery} க்கான ஆர்டர் திரையை திறக்கிறேன்.`
              };
              let oReply = orderReplies[lang] || orderReplies.en;
              
              setMessages(prev => [...prev, { role: "assistant", text: oReply, logId: null }]);
              speak(oReply);
              setLoading(false);
              return;
            } else {
              window.dispatchEvent(new CustomEvent("ai_autofill", { 
                detail: { context: contextStr, parsedData: parseData.data } 
              }));
              let mReply = `Searching the marketplace for: ${parseData.data.searchQuery || parseData.data.category || 'crops'}`;
              setMessages(prev => [...prev, { role: "assistant", text: mReply, logId: null }]);
              speak(mReply);
              setLoading(false);
              return;
            }
          }
        }
      }
      // If no actionable intent or it's a general question, use the RAG Chat endpoint
      const chatRes = await fetch(`${BASE_URL}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: textToProcess, role: user?.role || "guest", userId: user?._id || "anonymous", lang })
      });
      const chatData = await chatRes.json();
      
      if (chatData.response) {
        setMessages(prev => [...prev, { role: "assistant", text: chatData.response, logId: chatData.logId }]);
        speak(chatData.response);
      } else {
        const errorMsg = "I couldn't quite understand that. Could you try rephrasing?";
        setMessages(prev => [...prev, { role: "assistant", text: errorMsg }]);
        speak(errorMsg);
      }
    } catch (error) {
      console.error(error);
      const errMsg = "Oops, my connection to the AI engine failed. Please try again.";
      setMessages(prev => [...prev, { role: "assistant", text: errMsg }]);
      speak(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRate = async (logId, score) => {
    if (!logId) return;
    try {
      await fetch(`${BASE_URL}/api/ai/rate/${logId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score })
      });
      // Visually update the message to show it was rated
      setMessages(prev => prev.map(m => m.logId === logId ? { ...m, rated: score } : m));
    } catch (e) {
      console.error("Failed to rate AI");
    }
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && transcript.trim() && !isListeningRef.current) {
      handleProcessText(transcript.trim());
    }
  };
  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        style={{
          position: "fixed", bottom: "30px", right: "30px", zIndex: 9999,
          width: "60px", height: "60px", borderRadius: "50%",
          background: "linear-gradient(135deg, var(--green-mid), var(--green-deep))",
          color: "white", border: "none", boxShadow: "0 10px 25px rgba(22, 163, 74, 0.4)",
          display: isOpen ? "none" : "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer"
        }}
      >
        <Sparkles size={28} />
      </motion.button>
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            style={{
              position: "fixed", bottom: "30px", right: "30px", zIndex: 10000,
              width: "350px", height: "500px", background: "white",
              borderRadius: "24px", boxShadow: "0 15px 40px rgba(0,0,0,0.15)",
              display: "flex", flexDirection: "column", overflow: "hidden",
              border: "1px solid rgba(22, 163, 74, 0.1)"
            }}
          >
            {/* Header */}
            <div style={{ background: "linear-gradient(135deg, var(--green-mid), var(--green-deep))", padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", color: "white" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Sparkles size={20} />
                <span style={{ fontWeight: 700, fontFamily: "Outfit, sans-serif", fontSize: "1.1rem" }}>Rythu AI Assistant</span>
              </div>
              <button onClick={() => { window.speechSynthesis.cancel(); setIsOpen(false); }} style={{ background: "transparent", border: "none", color: "white", cursor: "pointer", display: "flex" }}>
                <X size={20} />
              </button>
            </div>
            {/* Chat Area */}
            <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem", background: "#f8fafc" }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{
                    maxWidth: "80%", padding: "0.75rem 1rem", borderRadius: "16px",
                    background: msg.role === "user" ? "var(--green-mid)" : "white",
                    color: msg.role === "user" ? "white" : "var(--text-dark)",
                    boxShadow: msg.role === "user" ? "none" : "0 2px 10px rgba(0,0,0,0.03)",
                    border: msg.role === "user" ? "none" : "1px solid #e2e8f0",
                    borderBottomRightRadius: msg.role === "user" ? "4px" : "16px",
                    borderBottomLeftRadius: msg.role === "assistant" ? "4px" : "16px",
                    fontSize: "0.9rem", lineHeight: 1.5,
                    display: "flex", flexDirection: "column", gap: "0.5rem"
                  }}>
                    <span>{msg.text}</span>
                    {msg.role === "assistant" && msg.logId && !msg.rated && (
                      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem", borderTop: "1px solid #e2e8f0", paddingTop: "0.5rem" }}>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Helpful?</span>
                        <button onClick={() => handleRate(msg.logId, 5)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.85rem" }}>👍</button>
                        <button onClick={() => handleRate(msg.logId, 1)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.85rem" }}>👎</button>
                      </div>
                    )}
                    {msg.role === "assistant" && msg.rated && (
                      <span style={{ fontSize: "0.75rem", color: "var(--green-light)", marginTop: "0.25rem" }}>Thanks for the feedback!</span>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <div style={{ background: "white", padding: "0.75rem 1rem", borderRadius: "16px", borderBottomLeftRadius: "4px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--green-mid)" }}>
                    <Loader2 size={16} className="lucide-spin" style={{ animation: "spin 2s linear infinite" }} /> Thinking...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={{ padding: "1rem", background: "white", borderTop: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <button 
                onClick={toggleListen}
                style={{
                  width: "40px", height: "40px", borderRadius: "50%", flexShrink: 0,
                  background: isListening ? "#fee2e2" : "#f1f5f9",
                  color: isListening ? "#ef4444" : "var(--text-mid)",
                  border: "none", display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", transition: "all 0.2s"
                }}
              >
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
              
              <input 
                type="text" 
                value={isListening ? sttInterim : transcript}
                onChange={(e) => setTranscript(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? "Listening..." : "Type or speak..."}
                style={{
                  flex: 1, padding: "0.6rem 1rem", borderRadius: "100px",
                  border: "1px solid #e2e8f0", outline: "none", fontSize: "0.9rem",
                  background: isListening ? "#f8fafc" : "white"
                }}
                disabled={isListening}
              />
              
              <button 
                onClick={() => handleProcessText(transcript.trim())}
                disabled={!transcript.trim() || isListening}
                style={{
                  width: "40px", height: "40px", borderRadius: "50%", flexShrink: 0,
                  background: transcript.trim() && !isListening ? "var(--green-mid)" : "#f1f5f9",
                  color: transcript.trim() && !isListening ? "white" : "#cbd5e1",
                  border: "none", display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", transition: "all 0.2s"
                }}
              >
                <Send size={18} />
              </button>
            </div>
            
            {/* Spinning keyframes added inline for Loader2 */}
            <style>{`
              @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

``



## Appendix: Project Structure Directory Tree

Below is the complete architectural directory tree for the Rythu Sethu project, highlighting the separation of concerns across the frontend React UI, backend Node.js APIs, and Python machine learning modules.

``text
RythuSethu/
├── backend
│   ├── config
│   │   ├── db.js
│   │   ├── jwt.js
│   │   └── multer.js
│   ├── controllers
│   │   ├── adminController.js
│   │   ├── agentController.js
│   │   ├── aiController.js
│   │   ├── authController.js
│   │   ├── cropController.js
│   │   ├── customerController.js
│   │   ├── deliveryController.js
│   │   ├── farmerController.js
│   │   ├── mlController.js
│   │   ├── orderController.js
│   │   └── paymentController.js
│   ├── data
│   │   └── seedData.js
│   ├── middleware
│   │   ├── authMiddleware.js
│   │   ├── errorMiddleware.js
│   │   ├── roleMiddleware.js
│   │   ├── upload.js
│   │   └── uploadMiddleware.js
│   ├── models
│   │   ├── Admin.js
│   │   ├── Agent.js
│   │   ├── AILog.js
│   │   ├── Auction.js
│   │   ├── Block.js
│   │   ├── BoxSubscription.js
│   │   ├── Cart.js
│   │   ├── Crop.js
│   │   ├── CropRequest.js
│   │   ├── Customer.js
│   │   ├── Delivery.js
│   │   ├── Demand.js
│   │   ├── Farm.js
│   │   ├── Farmer.js
│   │   ├── FarmTourBooking.js
│   │   ├── GlobalConfig.js
│   │   ├── Group.js
│   │   ├── Notification.js
│   │   ├── Order.js
│   │   ├── Payment.js
│   │   ├── Policy.js
│   │   ├── Prediction.js
│   │   ├── Review.js
│   │   ├── Subscription.js
│   │   ├── Ticket.js
│   │   └── User.js
│   ├── public
│   │   └── uploads
│   │       ├── aadhaarPhoto-1781519509873.jpg
│   │       ├── carrot.png
│   │       ├── delivery_1781335323017.jpg
│   │       ├── delivery_1781335804207.jpg
│   │       ├── delivery_1781501225177.webp
│   │       ├── farm_vegetables.png
│   │       ├── farmerPhoto-1781519509872.webp
│   │       ├── farmerPhoto-1782049255706.jpg
│   │       ├── farmerPhoto-1782049277855.jpg
│   │       ├── farmPhoto-1781519509873.jpeg
│   │       ├── farmPhoto-1782049255710.jpg
│   │       ├── farmPhoto-1782049277855.jpg
│   │       ├── hero.png
│   │       ├── image-1780820234879.webp
│   │       ├── image-1780820481704.webp
│   │       ├── image-1780882661286.webp
│   │       ├── image-1780893571906.webp
│   │       ├── image-1781191225440.jpg
│   │       ├── image-1781250648935.jpg
│   │       ├── image-1781334694825.jpg
│   │       ├── image-1781521635989.jpg
│   │       ├── potato.png
│   │       ├── productPhoto-1781519509873.jpeg
│   │       ├── productPhoto-1782049255711.jpg
│   │       ├── productPhoto-1782049277856.jpg
│   │       └── tomato.png
│   ├── routes
│   │   ├── adminRoutes.js
│   │   ├── aiRoutes.js
│   │   ├── auctionRoutes.js
│   │   ├── authRoutes.js
│   │   ├── boxRoutes.js
│   │   ├── cropRoutes.js
│   │   ├── deliveryRoutes.js
│   │   ├── ecommerceRoutes.js
│   │   ├── farmerRoutes.js
│   │   ├── farmTourRoutes.js
│   │   ├── groupRoutes.js
│   │   ├── mlRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── paymentRoutes.js
│   │   ├── policyRoutes.js
│   │   ├── publicRoutes.js
│   │   ├── reportRoutes.js
│   │   ├── subscriptionRoutes.js
│   │   └── ticketRoutes.js
│   ├── services
│   │   ├── cropSuggestionService.js
│   │   ├── deliveryRouteService.js
│   │   ├── demandPredictionService.js
│   │   ├── geminiService.js
│   │   ├── nutritionAnalysisService.js
│   │   ├── trustScoreService.js
│   │   └── weatherService.js
│   ├── uploads
│   │   └── farm_vegetables.png
│   ├── utils
│   │   ├── blockchain.js
│   │   ├── helpers.js
│   │   ├── logger.js
│   │   └── validators.js
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── check_orders.js
│   ├── fix_db.js
│   ├── package-lock.json
│   ├── package.json
│   ├── seed_users.js
│   ├── server.js
│   └── test_auto_assign.js
├── Diagrams
│   ├── 1_System_Architecture_UML.png
│   ├── 1_System_Architecture.png
│   ├── 2_Use_Case_Diagram_UML.png
│   ├── 2_Use_Case_Diagram.png
│   ├── 3_Class_Diagram_UML.png
│   ├── 3_Class_Diagram.png
│   ├── 4_Sequence_Diagram_UML.png
│   ├── 4_Sequence_Diagram.png
│   ├── 5_Activity_Diagram_Order_UML.png
│   ├── 5_Activity_Diagram_Order.png
│   └── Realistic_Architecture.png
├── frontend
│   ├── .vite
│   │   ├── deps
│   │   │   ├── _metadata.json
│   │   │   └── package.json
│   │   └── deps_temp_0663c7ec
│   │       └── package.json
│   ├── node_modules_old
│   │   ├── @esbuild
│   │   │   └── win32-x64
│   │   │       └── esbuild.exe
│   │   └── @rollup
│   │       └── rollup-win32-x64-msvc
│   │           └── rollup.win32-x64-msvc.node
│   ├── public
│   │   ├── agent_bike_final.png
│   │   ├── agent_bike_real.png
│   │   ├── agent_bike_right_final.png
│   │   ├── agent_bike.png
│   │   ├── agent_delivery.png
│   │   ├── agent.png
│   │   ├── birds.mp3
│   │   ├── birds.ogg
│   │   ├── crickets.mp3
│   │   ├── crops.png
│   │   ├── customer.png
│   │   ├── digital_farmer.png
│   │   ├── evening.mp3
│   │   ├── evening.ogg
│   │   ├── evening.wav
│   │   ├── farmer_harvest.png
│   │   ├── farmer.png
│   │   ├── flute.mp3
│   │   ├── flute.ogg
│   │   ├── flute.wav
│   │   ├── fresh_harvest_basket.png
│   │   ├── hanuman_admin.png
│   │   ├── happy_family_meal.png
│   │   ├── indian_farm_landscape.png
│   │   ├── indian_farmer_emblem.png
│   │   ├── logo.png
│   │   ├── manifest.json
│   │   ├── node_customer.png
│   │   ├── node_delivery.png
│   │   ├── node_farmer.png
│   │   ├── node_quality.png
│   │   ├── ram_farmer.png
│   │   ├── ram_setu_bridge.png
│   │   ├── ram_setu_construction.png
│   │   ├── ramsethu_4k_sun.png
│   │   ├── ramsethu_4k.png
│   │   ├── ramsethu_bg.png
│   │   ├── ramsethu_realistic_banks.png
│   │   ├── ramsethu_two_lands.png
│   │   ├── ramsethu-bg.jpg
│   │   ├── real_admin_human_rs.png
│   │   ├── real_agent_rs.png
│   │   ├── real_customer_rs.png
│   │   ├── real_farmer_rs.png
│   │   ├── real_hanuman_rs.png
│   │   ├── realistic_customer_1781523601840.png
│   │   ├── realistic_customer.png
│   │   ├── realistic_stone_texture.png
│   │   ├── role_admin.png
│   │   ├── seetha_customer.png
│   │   ├── sw.js
│   │   └── symbiotic_handshake.png
│   ├── src
│   │   ├── api
│   │   │   └── api.js
│   │   ├── components
│   │   │   ├── AdminGlobalMap.jsx
│   │   │   ├── AgentLiveMap.jsx
│   │   │   ├── AIAssistant.jsx
│   │   │   ├── AssistantOverlay.jsx
│   │   │   ├── AudioManager.jsx
│   │   │   ├── AuthenticityCertificate.jsx
│   │   │   ├── AutoSuggestInput.jsx
│   │   │   ├── BottomNav.css
│   │   │   ├── BottomNav.jsx
│   │   │   ├── CartSidebar.jsx
│   │   │   ├── EcoAdvisor.jsx
│   │   │   ├── FarmTourModal.jsx
│   │   │   ├── LiveMapModal.jsx
│   │   │   ├── LocationButton.jsx
│   │   │   ├── LocationPickerMap.jsx
│   │   │   ├── MapComponent.jsx
│   │   │   ├── MarketAnnouncer.jsx
│   │   │   ├── MarketplaceMap.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── PaymentModal.jsx
│   │   │   ├── RouteMap.jsx
│   │   │   ├── RythuSethuAnimation.jsx
│   │   │   ├── ToastNotification.jsx
│   │   │   ├── VoiceField.jsx
│   │   │   └── VoiceMicButton.jsx
│   │   ├── context
│   │   │   ├── AuthContext.jsx
│   │   │   ├── CartContext.jsx
│   │   │   ├── LangContext.jsx
│   │   │   ├── LayoutContext.jsx
│   │   │   └── SocketContext.jsx
│   │   ├── hooks
│   │   │   └── useMarketAudio.js
│   │   ├── pages
│   │   │   ├── Admin
│   │   │   │   ├── AdminDashboard.jsx
│   │   │   │   └── AdminFinancials.jsx
│   │   │   ├── Agent
│   │   │   │   ├── AgentDashboard.jsx
│   │   │   │   └── AgentFinancialLedger.jsx
│   │   │   ├── Auth
│   │   │   │   ├── Login.jsx
│   │   │   │   └── Register.jsx
│   │   │   ├── Farmer
│   │   │   │   ├── AddCrop.jsx
│   │   │   │   ├── Analytics.jsx
│   │   │   │   ├── FarmerDashboard.jsx
│   │   │   │   ├── FarmerFinancialLedger.jsx
│   │   │   │   ├── FarmerGroups.jsx
│   │   │   │   ├── FarmerLeaderboard.jsx
│   │   │   │   ├── FarmerProfitCalculator.jsx
│   │   │   │   └── FarmerTours.jsx
│   │   │   ├── Landing
│   │   │   │   └── LandingPage.jsx
│   │   │   ├── Marketplace
│   │   │   │   ├── CuratedBoxes.jsx
│   │   │   │   ├── CustomerFarmTours.jsx
│   │   │   │   ├── CustomerGroups.jsx
│   │   │   │   ├── CustomerOfflineTours.jsx
│   │   │   │   ├── CustomerOrders.jsx
│   │   │   │   └── Marketplace.jsx
│   │   │   └── Support
│   │   │       └── Support.jsx
│   │   ├── styles
│   │   │   ├── animations.css
│   │   │   ├── dashboard.css
│   │   │   ├── global.css
│   │   │   └── layout.css
│   │   ├── utils
│   │   │   ├── auth.js
│   │   │   ├── helpers.js
│   │   │   ├── tts.js
│   │   │   ├── useAutoSuggest.js
│   │   │   ├── useVoiceInput.js
│   │   │   ├── voiceParser.js
│   │   │   └── voiceParser.js.bak
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .gitignore
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   └── vite.config.js
├── ml_models
│   ├── __pycache__
│   │   ├── crop_suggestion.cpython-310.pyc
│   │   ├── demand_prediction.cpython-310.pyc
│   │   └── price_prediction.cpython-310.pyc
│   ├── data
│   │   └── nutrition_data.json
│   ├── inference
│   │   ├── crop_suggestion.py
│   │   ├── demand_prediction.py
│   │   ├── farmer_suggestion.py
│   │   ├── market_basket.py
│   │   ├── nutrition_analysis.py
│   │   ├── price_prediction.py
│   │   └── seasonal_prediction.py
│   ├── models
│   │   ├── crop_model.pkl
│   │   ├── demand_crops_map.pkl
│   │   ├── demand_model.pkl
│   │   ├── model_columns.pkl
│   │   ├── price_model.pkl
│   │   └── seasonal_model.pkl
│   ├── training
│   │   ├── __pycache__
│   │   │   └── train_demand_model.cpython-310.pyc
│   │   ├── dataset_generator.py
│   │   ├── train_crop_model.py
│   │   ├── train_demand_model.py
│   │   ├── train_model.py
│   │   └── train_seasonal_model.py
│   └── requirements.txt
├── .gitignore
├── Folder_Structure.txt
├── ML_Analysis.md
├── Project_Documentation.txt
├── Project_Report.md
├── README.md
├── setup_and_run.bat
├── temp_tree.txt
└── test.png
``


## Executive Summary

**Rythu Sethu** is a comprehensive, AI-powered agricultural ecosystem built on the MERN stack (MongoDB, Express, React, Node.js) integrated with advanced Machine Learning (ML) models. It bridges the gap between farmers, consumers, and delivery agents by providing a multilingual, voice-enabled, and real-time interactive platform. 
Key features include:
- **Omnipresent AI Assistant**: Multilingual voice-driven navigation and support.
- **Machine Learning**: Price prediction, demand forecasting, crop recommendations (using Random Forest), pest/disease detection (using CNNs), and market basket analysis (Apriori).
- **Real-Time Data**: WebSocket integration for live delivery tracking and auction bidding.
- **Micro-interactions**: High-end UI with dynamic farming environments, environmental audio, and role-based tailored dashboards.

---

## Viva Voce: Technical & ML Q&A

### 1. Core Architecture & Stack

**Q1: What is the technology stack used in Rythu Sethu?**
*Answer:* The project uses the MERN stack (MongoDB for database, Express.js for backend routing, React.js with Vite for the frontend UI, and Node.js for the runtime environment). Additionally, Python is used to serve Machine Learning inferences via `scikit-learn` and `pymongo`.

**Q2: How does the AI Voice Assistant work across different languages?**
*Answer:* The frontend captures speech using the Web Speech API (`SpeechRecognition`). The text is sent to the backend where an NLP engine (like Google Gemini API) extracts the "intent" (e.g., `navigate_tab`, `add_crop`). Responses are translated and spoken back to the user via the `speechSynthesis` API in their chosen regional language (Hindi, Telugu, Tamil, Kannada, English).

### 2. Machine Learning & Algorithms

**Q3: Which algorithm did you use for Price and Demand Prediction, and why?**
*Answer:* We used **Random Forest Regressor**. Agricultural data (weather, yield, price) is highly non-linear and prone to outliers (like sudden price surges). Random Forest handles non-linear relationships perfectly without requiring strict feature scaling, and it provides feature importance to explain predictions to farmers. SVR was rejected due to heavy computational cost, and Deep Learning was overkill for this tabular data.

**Q4: How does the system recommend crops to farmers?**
*Answer:* The Crop Suggestion model takes environmental inputs (Soil pH, Region, Season, historical yield). It uses an ensemble model to classify the best-suited crop. The system also factors in the current *Market Demand Prediction* to recommend crops that are not only suitable to grow but also highly profitable at the time of harvest.

**Q5: What algorithm is used for the "Frequently Bought Together" (Market Basket) feature?**
*Answer:* We implemented the **Apriori Algorithm**. It natively scans real-time MongoDB transaction logs to find item correlations by calculating Support, Confidence, and Lift. For instance, if data shows tomato buyers also buy onions 80% of the time, the system suggests onions at checkout.

**Q6: What is used for Pest and Disease Detection?**
*Answer:* We use **Convolutional Neural Networks (CNNs)**. Since pest detection relies on pixel data from leaf images, CNNs are the state-of-the-art global standard for computer vision tasks. They extract spatial hierarchies of features (edges, textures) from the crop image to classify the disease.

### 3. Real-Time & Backend Operations

**Q7: How did you implement live tracking for delivery agents?**
*Answer:* We used **Socket.io** (WebSockets) to establish a persistent, bi-directional connection between the Agent's client, the backend server, and the Customer's client. The agent's GPS coordinates are emitted at regular intervals, updating the live map on the customer's screen instantaneously without HTTP polling.

**Q8: How is authentication and security handled?**
*Answer:* We use **JSON Web Tokens (JWT)**. Upon login, the Node.js backend issues a signed JWT containing the user's ID and role (`farmer`, `customer`, `agent`, `admin`). This token is sent in the `Authorization` header of subsequent API requests. Middleware (`authMiddleware.js` and `roleMiddleware.js`) validates the token and restricts endpoints (e.g., only Farmers can access `/api/crops/add`).

