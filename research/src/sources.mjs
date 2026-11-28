// Where new public research on phone spyware is read from. Only these feeds
// are read, and only articles on these hosts are fetched: the worker never
// follows a link anywhere else.
export const FEEDS = [
  { name: "Citizen Lab", url: "https://citizenlab.ca/feed/" },
  { name: "Amnesty Security Lab", url: "https://securitylab.amnesty.org/feed/" },
  { name: "Amnesty International research", url: "https://www.amnesty.org/en/latest/research/feed/" },
  { name: "Kaspersky Securelist", url: "https://securelist.com/feed/" },
  { name: "ESET WeLiveSecurity", url: "https://www.welivesecurity.com/en/rss/feed/" },
  { name: "Google Threat Intelligence", url: "https://feeds.feedburner.com/threatintelligence/pvexyqv7v0v" },
  { name: "Access Now", url: "https://www.accessnow.org/feed/" },
  { name: "TechCrunch (spyware)", url: "https://techcrunch.com/tag/spyware/feed/" },
];

export const ARTICLE_HOSTS = new Set([
  "citizenlab.ca",
  "securitylab.amnesty.org",
  "www.amnesty.org",
  "securelist.com",
  "www.welivesecurity.com",
  // ESET's articles now live on its main site.
  "www.eset.com",
  "cloud.google.com",
  "www.accessnow.org",
  "techcrunch.com",
]);

// An article is read only when its title or summary is about phone spyware:
// most of these feeds also cover other topics.
const TOPIC = /\b(spyware|stalkerware|stalker ?ware|watchware|surveillance ?ware|mercenary|zero[- ]click|one[- ]click|exploit chain|pegasus|predator|intellexa|cytrox|candiru|paragon|graphite|nso group|quadream|reign|cellebrite|finfisher|finspy|hermit|rcs lab|novispy|lightspy|wyrmspy|dragonegg|badbazaar|moonshine|triangulation|blastpass|forcedentry|iphone|ios|android|apk|mobile malware|smartphone|phone)\b/i;

export function onTopic(text) {
  return TOPIC.test(text || "");
}
