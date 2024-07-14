import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";

import "./styles/article.css";

const Article = (props) => {
    const { title, description, date, link } = props;
	console.log(props)

    const handleClick = (event) => {
		console.log('testing', link)
        event.preventDefault();
        window.open(link, '_blank', 'noopener,noreferrer');
    };

    return (
        <React.Fragment>
            <div className="homepage-article">
                <div className="homepage-article-content">
                    <div className="homepage-article-date">
                        |&nbsp;&nbsp;&nbsp;{date}
                    </div>
                    <div className="homepage-article-title">{title}</div>
                    <div className="homepage-article-description">
                        {description}
                    </div>
                    <div className="homepage-article-link">
                        <button onClick={handleClick} className="article-link">
                            Read article{" "}
                            <FontAwesomeIcon
                                style={{ fontSize: "10px" }}
                                icon={faChevronRight}
                            />
                        </button>
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
};

export default Article;
