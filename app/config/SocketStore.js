/**
 * In-memory store for socket online status.
 * Tracks how many socket connections each user has (multiple devices/tabs).
 */
const onlineUsers = new Map(); // userId -> connection count

function setOnline(userId) {
    const count = (onlineUsers.get(userId) || 0) + 1;
    onlineUsers.set(userId, count);
}

/**
 * @returns {boolean} true if user has no connections left (now offline)
 */
function setOffline(userId) {
    const count = (onlineUsers.get(userId) || 1) - 1;
    if (count <= 0) {
        onlineUsers.delete(userId);
        return true;
    }
    onlineUsers.set(userId, count);
    return false;
}

function isOnline(userId) {
    return (onlineUsers.get(userId) || 0) > 0;
}

function getOnlineUserIds() {
    return Array.from(onlineUsers.keys());
}

module.exports = {
    setOnline,
    setOffline,
    isOnline,
    getOnlineUserIds,
};
