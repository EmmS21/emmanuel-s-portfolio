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
					"Turning a business problem into a product people use: find where the work breaks, design the system, ship it.",
				tools: ["Discovery", "System design", "React", "TypeScript", "Electron"],
				work: [
					{ project: "blackstone", did: "Turned call transcripts into structured portfolio intelligence for consulting and investment teams, saving six figures in billable hours." },
					{ project: "vial", did: "Turned unstructured clinical-trial PDFs into validated data that stakeholder reports could rely on." },
					{ project: "fundaai", did: "Designed exam prep that works with or without internet, from the app store to the tutors." },
					{ project: "adalchemy", did: "Gave small businesses a marketing function, run from a Discord bot, with the owner approving every ad." },
					{ project: "pair", did: "Built practice for the part interviews test: explaining your logic to another person." },
				],
			},
			{
				id: "backend",
				label: "Backend and Infrastructure",
				color: "#6fb6e8",
				summary:
					"APIs, pipelines and storage that keep working when the network does not.",
				tools: ["FastAPI", "Go", "AWS Lambda", "PostgreSQL", "Dagger", "Snowflake"],
				work: [
					{ project: "blackstone", did: "FastAPI endpoints, Snowflake-to-RDS migration on AWS Lambda, and role-based access for sensitive portfolio data." },
					{ project: "fundaai", did: "FastAPI and Go services: the store, device auth, automatic updates, the local cache and the offline queue." },
					{ project: "vial", did: "Document extraction pipeline: PDF parsing, fields extracted against fixed schemas, validation before API handoff." },
					{ project: "pair", did: "Django backend with a Redis waiting room that matches two people, voice calls and live shared code." },
					{ project: "daggerverse", did: "Reusable pipeline modules: bank data in, categories and advice out by SMS." },
					{ project: "adalchemy", did: "Each business joins an SQS queue, research runs in AWS Lambda, results land in MongoDB." },
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
					{ project: "opensource", did: "Nine merged pull requests across GizmoSQL, GrowthBook, Dagger, OpenFn and Koza." },
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
					"Call transcripts come in",
					"AI workflows extract and classify the issues",
					"The data is normalized into relational schemas",
					"Role-based access decides who sees what",
					"Teams get structured portfolio intelligence",
				],
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
				system: [
					"The store keeps tutors installed and updated",
					"While online, the cache pulls new questions for each subject",
					"A small model on the laptop marks answers instantly",
					"While offline, work waits in a queue",
					"Back online, a larger model writes the deeper report",
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
				system: [
					"Bank transactions come in",
					"AI sorts the spending into categories",
					"The results are stored",
					"AI writes budgeting advice",
					"The advice goes out by SMS",
				],
				metric: "Build once",
				value: "Each step is a reusable module that gives the same result on a laptop, in CI or in the cloud. Swap a few blocks and the same pipeline writes unit tests.",
				links: [
					{ label: "View the modules", url: "https://github.com/EmmS21/daggerverse" },
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
				metric: "9 merged",
				value: "Nine pull requests merged in 2026, each one starting where a real user got stuck.",
				details: [
					{
						label: "GizmoSQL · max sessions",
						text: "A full server now refuses new clients with a clear retry error instead of falling over.",
						url: "https://github.com/gizmodata/gizmosql/pull/185",
					},
					{
						label: "GizmoSQL · idle timeout",
						text: "Quiet connections free their seat, but never while someone is still downloading results.",
						url: "https://github.com/gizmodata/gizmosql/pull/186",
					},
					{
						label: "GizmoSQL · memory limit",
						text: "Tests prove the memory limit reaches DuckDB, and unsafe values stop the server from starting.",
						url: "https://github.com/gizmodata/gizmosql/pull/187",
					},
					{
						label: "GizmoSQL · secrets",
						text: "On a shared server, no client can print the stored passwords.",
						url: "https://github.com/gizmodata/gizmosql/pull/193",
					},
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
					{ label: "GizmoSQL map", url: "https://emms21.github.io/gizmosql-universe/gizmoSQL/" },
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
