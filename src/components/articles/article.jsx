import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import myArticles from "../../data/articles"; 

import "./style/article.css";

const Article = (props) => {
    const { date, title, description, index } = props;

	const handleClick = (event) => {
		console.log('testing')
		event.preventDefault();
		const article = myArticles[index]();
		if (article.link) {
			window.open(article.link, '_blank', 'noopener,noreferrer');
		}
	};
	
    return (
        <div className="article">
            <div className="article-left-side">
                <div className="article-date">{date}</div>
            </div>

            <div className="article-right-side">
                <div className="article-title">{title}</div>
                <div className="article-description">{description}</div>
                <button onClick={handleClick} className="article-link">
                    Read Article{" "}
                    <FontAwesomeIcon
                        style={{ fontSize: "10px" }}
                        icon={faChevronRight}
                    />
                </button>
            </div>
        </div>
    );
};

export default Article;