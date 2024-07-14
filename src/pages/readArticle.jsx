// import React, { useEffect } from "react";
// import { useParams } from "react-router-dom";
// import myArticles from "../data/articles";

// const ReadArticle = () => {
//     const { slug } = useParams();

//     useEffect(() => {
//         const article = myArticles[slug - 1];
//         if (article && article().link) {
//             window.open(article().link, '_blank', 'noopener,noreferrer');
//         }
//     }, [slug]);

//     return null;
// };

// export default ReadArticle;