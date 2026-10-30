const INFO = {
	main: {
		title: "Emmanuel Sibanda",
		name: "Emmanuel Sibanda",
		email: "emmanuel@emmanuelsibanda.com",
		logo: "../logo.png",
	},

	socials: {
		twitter: "https://x.com/Emmoemm",
		github: "https://github.com/EmmS21?tab=repositories",
		linkedin: "https://www.linkedin.com/in/emmanuel-s-42b49176/",
	},

	calendly:
		"https://calendly.com/emmanuel-emmanuelsibanda/automation-discovery-call",

	homepage: {
		tagline: "Emmanuel Sibanda",
		pitch: "I understand business problems and the users behind them, then build software and automation that grow revenue and cut costs.",

		skills: [
			{
				id: "product",
				label: "Product Engineer",
				color: "#e2b878",
				summary:
					"I map how users and teams actually work and translate those workflows into software, from discovery through design and delivery.",
				tools: [],
				work: [
					{
						project: "blackstone",
						did: "Worked with consulting and investment teams to translate their transcript review workflow into automation that extracts and classifies issues, stores structured portfolio intelligence, and enforces role-based access, resulting in productivity gains amounting to 6 figures in billable hour savings.",
					},
					{
						project: "gizmodata",
						did: "GizmoData is how multiple programs query the same DuckDB. Users were losing work when the server filled up and crashed, waiting behind idle connections that held a seat, running on machines that did not actually cap memory, and exposed to other clients reading stored passwords. Shipped four merged fixes so a full server tells the next user to retry instead of taking everyone down, a quiet connection gives up its seat without cutting off a download in progress, the server will not start if memory is configured unsafely, and no client can print stored passwords.",
					},
					{
						project: "fundaai",
						did: "FundaAI is an AI learning system that helps kids across Africa improve their STEM grades and grow into engineers. It is an offshoot of The Gradient Boost, where I raised $50,000. Students get tutors and exam practice that still work when the internet is down.",
					},
				],
			},
			{
				id: "backend",
				label: "Backend and Infrastructure",
				color: "#6fb6e8",
				summary:
					"I build the APIs, pipelines and storage, then debug what they cost to run and make sure the data can come back.",
				tools: [],
				work: [
					{
						project: "blackstone",
						did: "Debugged AWS costs and reduced them by indexing and refactoring databases. Backed up data through Terraform so the system could be recovered after a failure.",
					},
					{
						project: "fundaai",
						did: "FastAPI and Go services for the store, device auth, automatic updates, the local cache and the offline queue, so tutors still run when the network is down.",
					},
					{
						project: "vial",
						did: "A pipeline that takes clinical-trial PDFs, parses each document, extracts fields against a fixed schema, validates the result, and hands clean JSON to the reporting API.",
					},
					{
						project: "daggerverse",
						did: "Reusable Dagger modules: bank transactions come in, AI sorts spending into categories, results are stored, and budgeting advice goes out by SMS. The same modules run on a laptop, in CI, or in the cloud.",
					},
				],
			},
			{
				id: "forward",
				label: "Forward Deployed | Solutions Engineer",
				color: "#c9a0e8",
				summary:
					"Going into someone else's system, finding where real users get stuck, proving the cause, and shipping the fix.",
				tools: ["Issue mapping", "Repro tests", "C++", "Go", "Python", "TypeScript"],
				work: [
					{ project: "opensource", did: "Five merged pull requests across GrowthBook, Dagger, OpenFn and Koza." },
				],
			},
		],

		history: [
			{
				org: "Blackstone",
				role: "Software Engineer",
				place: "New York",
				dates: "Oct 2024 – Apr 2026",
				summary:
					"AI workflows that turn call transcripts into portfolio intelligence, a Snowflake-to-RDS migration on AWS Lambda, and standard CI/CD across repositories.",
				project: "blackstone",
			},
			{
				org: "Vial",
				role: "Full Stack Engineer",
				place: "San Francisco, remote",
				dates: "Jan 2023 – Dec 2023",
				summary:
					"A pipeline that turns clinical-trial PDFs into schema-validated JSON for stakeholder reports.",
				project: "vial",
			},
			{
				org: "The Gradient Boost",
				role: "Founder and Engineer",
				place: "New York",
				dates: "Jan 2020 – Dec 2022",
				summary:
					"Raised $50,000 and hired 5 remote software and data engineers. Built the React and Django learner dashboard that showed hiring partners who was ready for analyst roles.",
				skills: ["product", "backend"],
			},
			{
				org: "Yoco",
				role: "Data Analyst and Engineer",
				place: "Cape Town, South Africa",
				dates: "Jan 2019 – Dec 2019",
				summary:
					"Python and SQL across NoSQL and PostgreSQL, building the dashboards sales and marketing used to measure performance.",
				skills: ["backend"],
			},
			{
				org: "Google",
				role: "Data Analyst Intern",
				dates: "2017",
				skills: ["backend"],
			},
			{
				org: "University of KwaZulu-Natal",
				role: "Bachelor of Laws",
				place: "South Africa",
				skills: [],
			},
		],

		projects: [
			{
				id: "blackstone",
				title: "Blackstone",
				industry: "Finance",
				spring: "Portfolio insight stuck in call transcripts",
				logo: "logos/blackstone.svg",
				problem:
					"Consulting and investment teams pulled portfolio insight out of call transcripts by hand, into fragmented systems.",
				system: [
					"Extract Zoom transcripts.",
					"Summarize based on user context. Summarization goes through middleware that checks the user role and applies the right nuance, tested through reviews.",
					"Extract issues and categorize them.",
					"Validate the AI output against existing data to check accuracy.",
					"An EventBridge timer sends emails through an SQS queue.",
					"The automation generates the email content.",
					"Middleware verifies the receiver's permissions before anything is sent.",
				],
				stack: ["FastAPI Python", "AI", "Terraform", "AWS", "Docker"],
				metric: "6-figure",
				value: "Six figures in estimated billable-hour savings, with consultants spending their time on decisions instead of data entry.",
			},
			{
				id: "vial",
				title: "Vial",
				industry: "Biotech",
				spring: "Clinical-trial data locked in PDFs",
				logo: "logos/vial.svg",
				problem:
					"Clinical-trial results arrived as unstructured PDFs, but external stakeholder reports needed clean, structured data.",
				system: [
					"Clinical-trial PDFs come in",
					"Each document is parsed",
					"Fields are extracted against a fixed schema",
					"The result is validated before handoff",
					"Clean JSON goes to the reporting API",
				],
				metric: "PDF to JSON",
				value: "Unstructured trial documents became validated data that stakeholder reports could rely on.",
			},
			{
				id: "fundaai",
				title: "FundaAI",
				industry: "Education",
				spring: "No internet at exam time",
				problem:
					"Students across Africa prepare for Grade 7, O Level and A Level exams, often with patchy internet.",
				modelTips: {
					"local model": "DeepSeek R1 Distill 1.5B",
					"online model": "DeepSeek R1 Distill 70B",
				},
				workflows: [
					{
						label: "A student wants a new AI Tutor",
						steps: [
							"Middleware checks the laptop against its hardware ID so only that machine can ask for software.",
							"The subscription for that machine is checked. If it has lapsed, the store does not hand over a new tutor.",
							"The laptop pings for 60 seconds to see if it is online.",
							"The app store lists tutors that machine is allowed to get.",
							"Download goes through middleware, then the tutor is installed on the laptop.",
						],
					},
					{
						label: "A student practices a question",
						steps: [
							"The laptop already has a local model for inference, so marking can happen on the machine.",
							"The system pings for 60 seconds to see if the student is online.",
							"If they are online, the online model runs.",
							"If they are not, the local model marks the work on the laptop.",
						],
					},
					{
						label: "Apps update without interrupting the student",
						steps: [
							"Linux scripts run in the background and test whether an app needs an update.",
							"The check stays off the student's session so the laptop saves compute.",
							"When an update is needed, it is pulled through the store.",
						],
					},
					{
						label: "Check the student is still subscribed",
						steps: [
							"Middleware reads the laptop hardware ID.",
							"That ID is checked against the active subscription.",
							"If the subscription is not active, tutors that need a live licence do not run.",
						],
					},
					{
						label: "The local model is fine-tuned",
						steps: [
							"Marked student work is collected when the laptop is online.",
							"That work is used to fine-tune the local model.",
							"The updated model is distributed back to the laptop through the store.",
						],
					},
				],
				stack: [
					"Python",
					"PySide6",
					"Electron",
					"React",
					"TypeScript",
					"FastAPI",
					"Go",
					"PostgreSQL",
					"SQLite",
					"llama-cpp",
					"Groq",
					"Dagger",
					"MongoDB",
					"Firebase",
					"Modal",
					"Supabase",
				],
				metric: "Online or off",
				value: "The same exam prep with or without internet. First student: my 12-year-old nephew in Zimbabwe, mentored weekly.",
				links: [
					{ label: "View the code", url: "https://github.com/EmmS21/fundAI" },
				],
			},
			{
				id: "daggerverse",
				title: "Daggerverse",
				industry: "Developer tools",
				spring: "Works on my machine",
				problem:
					"Pipelines get rebuilt from scratch for every project, and run differently on every machine.",
				workflows: [
					{
						label: "A household wants weekly budgeting advice by SMS",
						steps: [
							"Tiller writes bank transactions from several accounts into a Google Sheet.",
							"FetchSpreadsheetData pulls that sheet into JSON inside a container, with unchanged layers cached.",
							"filterForNewTransactions drops any Transaction ID already stored in MongoDB.",
							"categorizeExpenses sends batches to facebook/bart-large-mnli and assigns Grocery, Takeouts, and the rest of the household categories, resizing batches when Hugging Face rate limits hit.",
							"writeToMongo upserts each categorized row by Transaction ID.",
							"getFromMongo aggregates spend by week and category with Atlas Search.",
							"getAdvice uses LangChain and OpenAI to write the note, stores conversation memory in MongoDB, and can rewrite the prompt from household feedback.",
							"A parent module sends the SMS through TextBelt. GitHub Actions runs this every three days.",
						],
						links: [
							{
								label: "Watch the presentation",
								url: "https://youtu.be/YxfW-TgOGkc",
							},
						],
					},
					{
						label: "An investor wants stocks ranked against paying down debt",
						steps: [
							"GetStocks scrapes the S&P 500 list, pulls history from yfinance, and ranks symbols by average return in the sectors named.",
							"StocksToMongo writes each stock as its own document.",
							"CalculateTimeValue pulls CPI from FRED and compares the future value of paying down debt versus holding the same money in a stock, after inflation.",
							"vcstockbrain calls GetStocks for Health Care, Information Technology, Financials and Energy.",
						],
						links: [
							{
								label: "Watch the presentation",
								url: "https://youtu.be/YxfW-TgOGkc",
							},
						],
					},
					{
						label: "A developer needs unit tests for a SvelteKit page",
						steps: [
							"The project is mounted into a container so the agent can read the src tree.",
							"LangChain suggests unit tests against isolation, speed and naming, then refines those suggestions.",
							"It writes TypeScript tests from the suggestions, with types and imports that match the tree.",
							"The test file is exported to the host.",
						],
						links: [
							{
								label: "Watch the presentation",
								url: "https://youtu.be/Gq7qiEZ450Y",
							},
						],
					},
					{
						label: "Tests should pass the same on every machine",
						steps: [
							"The Node project is mounted into the project's Docker image.",
							"npm install runs, then npm run test.",
							"The same image is used locally and in CI, so a pass here is a pass everywhere.",
						],
						links: [
							{
								label: "Watch the presentation",
								url: "https://youtu.be/Gq7qiEZ450Y",
							},
						],
					},
					{
						label: "Research a business for ads",
						steps: [
							"ResearcherContainer calls a Modal agent that browses the company and groups users into personas.",
							"The agent returns keywords and ad text.",
							"MarketingAgent stores that output in MongoDB under the company name.",
						],
					},
				],
				stack: ["Dagger", "Docker", "Python", "MongoDB"],
				links: [
					{ label: "View the modules", url: "https://github.com/EmmS21/daggerverse" },
				],
			},
			{
				id: "gizmodata",
				title: "GizmoData",
				industry: "Data and dev tools",
				stack: ["C++"],
				details: [
					{
						label: "Max sessions",
						text: "A full server now refuses new clients with a clear retry error instead of falling over.",
						url: "https://github.com/gizmodata/gizmosql/pull/185",
					},
					{
						label: "Idle timeout",
						text: "Quiet connections free their seat, but never while someone is still downloading results.",
						url: "https://github.com/gizmodata/gizmosql/pull/186",
					},
					{
						label: "Memory limit",
						text: "Tests prove the memory limit reaches DuckDB, and unsafe values stop the server from starting.",
						url: "https://github.com/gizmodata/gizmosql/pull/187",
					},
					{
						label: "Secrets",
						text: "On a shared server, no client can print the stored passwords.",
						url: "https://github.com/gizmodata/gizmosql/pull/193",
					},
				],
				links: [
					{
						label: "Revenue simulation",
						url: "https://emms21.github.io/gizmosql-followup/",
					},
					{
						label: "How GizmoData changes unit economics",
						url: "https://www.linkedin.com/pulse/how-gizmosql-could-change-the-unit-economics-ai-analytics-sibanda-kiiqe/",
					},
					{
						label: "Session limits and idle timeouts",
						url: "https://gizmodata.com/blog/gizmosql-session-limits-idle-timeouts",
					},
				],
			},
			{
				id: "opensource",
				title: "Open source",
				industry: "Data and dev tools",
				spring: "Users stuck, cause unknown",
				problem:
					"Maintainers hear where users get stuck, but not why.",
				system: [
					"Map the product from its issues, by the step that breaks",
					"Find the real user's moment in issues and Slack threads",
					"Prove the cause with a test before changing code",
					"Fix it upstream",
				],
				metric: "5 merged",
				value: "Five pull requests merged in 2026, each one starting where a real user got stuck.",
				details: [
					{
						label: "GrowthBook · experiments",
						text: "Traced three Slack threads to one misunderstanding about when a user enters an experiment.",
						url: "https://github.com/growthbook/growthbook/pull/6598",
					},
					{
						label: "GrowthBook · refresh",
						text: "Reproduced it with a fake server: backgroundSync does not refresh features.",
						url: "https://github.com/growthbook/growthbook/pull/6599",
					},
					{
						label: "Dagger · blocked networks",
						text: "Pointed the proxy at a dead address to find which settings reach the code.",
						url: "https://github.com/dagger/dagger/pull/13797",
					},
					{
						label: "OpenFn · health data",
						text: "Health record errors now come back as data integrations can read.",
						url: "https://github.com/OpenFn/adaptors/pull/1736",
					},
					{
						label: "Koza · biomedical data",
						text: "An import that silently dropped 47% of records now stops and says so.",
						url: "https://github.com/monarch-initiative/koza/pull/242",
					},
				],
				links: [
					{ label: "GrowthBook map", url: "https://emms21.github.io/united-universes/" },
					{ label: "Dagger map", url: "https://emms21.github.io/dagger-universe/" },
				],
			},
			{
				id: "pair",
				title: "Pair programming",
				industry: "Education",
				spring: "Practicing interviews alone",
				problem:
					"People preparing for interviews practiced alone, and never explained their thinking out loud.",
				system: [
					"A waiting room matches two people",
					"A voice call starts",
					"The driver picks a difficulty, from 2,000 challenges",
					"The driver types; the observer sees the code appear",
				],
				metric: "Live",
				value: "Practice for the part interviews actually test: explaining your logic to another person.",
				links: [
					{ label: "Open the app", url: "https://peerprogrammingplatform.vercel.app/" },
				],
			},
			{
				id: "adalchemy",
				title: "AdAlchemy",
				industry: "Marketing",
				spring: "No marketing team",
				problem: "Small businesses can't afford a marketing team.",
				system: [
					"The owner onboards through a Discord bot",
					"Each business joins a queue",
					"An AI agent researches each customer type",
					"It writes keywords and ad variations",
					"The owner approves, then it connects to Google Ads",
				],
				metric: "Owner in control",
				value: "A marketing function for a business that never had one, with the owner making the final call.",
				links: [
					{ label: "View the code", url: "https://github.com/EmmS21/AdAlchemyAILambdaFuncs" },
					{ label: "Watch the demo", url: "https://www.youtube.com/watch?v=pg9MK9YbmvQ" },
				],
			},
		],
	},
};

export default INFO;
