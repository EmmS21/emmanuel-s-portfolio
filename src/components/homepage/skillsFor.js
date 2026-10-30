// Skills whose work list includes this project.
const skillsFor = (skills, projectId) =>
	skills.filter((skill) => skill.work.some((item) => item.project === projectId));

export default skillsFor;
