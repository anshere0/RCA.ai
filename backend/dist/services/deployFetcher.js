"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchRecentDeploys = fetchRecentDeploys;
const axios_1 = __importDefault(require("axios"));
async function fetchRecentDeploys(repoOwner, repoName, incidentTime, token) {
    const since = new Date(incidentTime.getTime() - 4 * 60 * 60 * 1000);
    try {
        const response = await axios_1.default.get(`https://api.github.com/repos/${repoOwner}/${repoName}/commits`, {
            headers: { Authorization: `token ${token}` },
            params: { since: since.toISOString(), per_page: 20 },
        });
        const commits = response.data.map((c) => {
            const commitTime = new Date(c.commit.author.date);
            const minutesBefore = (incidentTime.getTime() - commitTime.getTime()) / 60000;
            return {
                sha: c.sha.slice(0, 7),
                message: c.commit.message.split("\n")[0],
                author: c.commit.author.name,
                timestamp: c.commit.author.date,
                url: c.html_url,
                minutesBeforeIncident: Math.round(minutesBefore),
                isSuspect: minutesBefore > 0 && minutesBefore < 120,
            };
        });
        return commits.sort((a, b) => a.minutesBeforeIncident - b.minutesBeforeIncident);
    }
    catch {
        return [];
    }
}
