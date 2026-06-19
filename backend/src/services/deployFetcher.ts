import axios from "axios";

export type Deploy = {
  sha: string;
  message: string;
  author: string;
  timestamp: string;
  url: string;
  minutesBeforeIncident: number;
  isSuspect: boolean;
};

export async function fetchRecentDeploys(
  repoOwner: string,
  repoName: string,
  incidentTime: Date,
  token: string
): Promise<Deploy[]> {
  const since = new Date(incidentTime.getTime() - 4 * 60 * 60 * 1000);

  try {
    const response = await axios.get(
      `https://api.github.com/repos/${repoOwner}/${repoName}/commits`,
      {
        headers: { Authorization: `token ${token}` },
        params: { since: since.toISOString(), per_page: 20 },
      }
    );

    const commits: Deploy[] = response.data.map((c: any) => {
      const commitTime = new Date(c.commit.author.date);
      const minutesBefore =
        (incidentTime.getTime() - commitTime.getTime()) / 60000;
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

    return commits.sort(
      (a, b) => a.minutesBeforeIncident - b.minutesBeforeIncident
    );
  } catch {
    return [];
  }
}
