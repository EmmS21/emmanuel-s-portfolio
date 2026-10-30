const slow = (type) => type === "slow-2g" || type === "2g";

export const canPreload = () => {
	const conn =
		navigator.connection ||
		navigator.mozConnection ||
		navigator.webkitConnection;
	if (conn?.saveData) return false;
	if (slow(conn?.effectiveType)) return false;
	return true;
};

export const warm = (load) => {
	if (!canPreload()) return;
	load();
};
