import React from "react";

function article_1() {
    return {
        date: "21 May 2024",
        title: "A pipeline of containers running AI Agents to send budgeting advice via SMS",
        description:
            "A pipeline automating the process of fetching, updating and structuring multiple types of data that is used by AI Agents to generate nuanced budgeting advice sent to the end user via SMS.",
        link: "https://emmanuelsibanda.hashnode.dev/a-dagger-pipeline-sending-weekly-smss-with-financial-advice-generated-by-ai",
		isExternal: true,
        keywords: [
            "AI Agents",
            "AI",
            "Python",
            "OCI",
            "Python",
            "Financial Advice",
			"LangChain"
        ],
        style: `
                .article-content {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .randImage {
                    align-self: center;
                    outline: 2px solid red;
                }
                `
    };
}

function article_2() {
    return {
        date: "29 April 2024",
        title: "A Dagger module to generate unit tests for a SvelteKit project using AI",
        description:
            "An AI Agent running in an OCI container to write unit tests for Typescript projects.",
        link: "https://emmanuelsibanda.hashnode.dev/a-dagger-module-to-generate-unit-tests-for-a-sveltekit-project-using-ai",
        style: ``,
        keywords: [
            "python",
            "AI Agents",
			"LangChain",
			"OCI",
        ]
    };
}

function article_3() {
    return {
        date: "15 April 2024",
        title: "A RAG system powering an AI chatbot to answer legal questions regarding investing in property in LATAM",
        description:
            "A RAG system powering an AI chatbot to answer legal questions regarding investing in property in LATAM.",
        link: "https://emmanuelsibanda.hashnode.dev/using-rag-to-build-a-chatbot-to-navigate-the-legal-challenges-of-investing-in-real-estate-in-colombia",
        style: ``,
        keywords: [
            "sveltekit",
            "typescript",
            "FastAPI",
			"python",
            "RAG",
			"LangChain",
        ]
    };
}

function article_4() {
    return {
        date: "5 February 2024",
        title: "A Platform to Help Users Practice Programming Challenges Guided by AI",
        description:
            "A platform using AI to help people practice for coding interviews",
        link: "https://hackernoon.com/i-built-a-platform-to-help-users-practice-programming-challenges-guided-by-ai",
        style: ``,
        keywords: [
            "python",
            "django",
            "AI",
			"Redis"
        ]
    };
}

function article_5() {
    return {
        date: "10 March 2020",
        title: "Raising money from angel investors for an EDTech to train Data Analytics talent in Africa",
        description:
            "Raising over $50k to build an EdTech to train data analytics talent in Africa",
        link: "https://www.techinafrica.com/gradient-boost-receives-investment-money-from-a-strategic-investor/",
        style: ``,
        keywords: [
            "startups",
            "fundraising",
        ]
    };
}

function article_6() {
    return {
        date: "19 December 2019",
        title: "A Boxing Prediction Web App on Shiny, Here's How",
        description:
            "A platform using AI to help people practice for coding interviews",
        link: "https://hackernoon.com/i-built-a-boxing-prediction-web-app-on-shiny-here-is-how-jz8932xt",
        style: ``,
        keywords: [
            "machine learning",
            "python",
            "r",
        ]
    };
}

const myArticles = [article_1, article_2, article_3, article_4, article_5, article_6];

export default myArticles;
