import httpx
import asyncio
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

OPENALEX_BASE = "https://api.openalex.org/works"
PUBMED_ESEARCH = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
PUBMED_EFETCH = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
PUBMED_ESUMMARY = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"
SEMANTIC_SCHOLAR_BASE = "https://api.semanticscholar.org/graph/v1/paper/search"
CORE_BASE = "https://api.core.ac.uk/v3/search/works"


def _clean(val: Any) -> str:
    if val is None:
        return ""
    return str(val).strip()


async def search_openalex(
    keywords: str,
    universities: List[str],
    journals: List[str],
    per_page: int = 20,
) -> List[Dict]:
    params: Dict[str, Any] = {
        "search": keywords,
        "per-page": per_page,
        "select": "id,doi,title,authorships,primary_location,publication_year,abstract_inverted_index,open_access",
        "mailto": "literature-search@example.com",
    }

    filters = []
    if universities:
        uni_filter = "|".join(universities[:5])
        filters.append(f"institutions.display_name:{uni_filter}")
    if journals:
        journal_filter = "|".join(journals[:5])
        filters.append(f"primary_location.source.display_name:{journal_filter}")
    if filters:
        params["filter"] = ",".join(filters)

    results = []
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(OPENALEX_BASE, params=params)
            resp.raise_for_status()
            data = resp.json()
            for work in data.get("results", []):
                doi = None
                if work.get("doi"):
                    doi = work["doi"].replace("https://doi.org/", "")

                title = _clean(work.get("title", "Untitled"))

                authors = []
                for auth in work.get("authorships", [])[:5]:
                    author_name = auth.get("author", {}).get("display_name", "")
                    if author_name:
                        authors.append(author_name)

                journal = None
                loc = work.get("primary_location") or {}
                source = loc.get("source") or {}
                journal = source.get("display_name")

                year = work.get("publication_year")

                abstract = None
                inv = work.get("abstract_inverted_index")
                if inv:
                    try:
                        word_positions = []
                        for word, positions in inv.items():
                            for pos in positions:
                                word_positions.append((pos, word))
                        word_positions.sort(key=lambda x: x[0])
                        abstract = " ".join(w for _, w in word_positions)
                    except Exception:
                        pass

                url = work.get("doi") or work.get("id")

                results.append({
                    "doi": doi,
                    "title": title,
                    "authors": authors,
                    "journal": journal,
                    "year": year,
                    "abstract": abstract,
                    "url": url,
                    "source_db": "OpenAlex",
                })
    except Exception as e:
        logger.error(f"OpenAlex search error: {e}")

    return results


async def search_pubmed(
    keywords: str,
    universities: List[str],
    journals: List[str],
    max_results: int = 20,
) -> List[Dict]:
    term = keywords
    if journals:
        journal_parts = " OR ".join(f'"{j}"[Journal]' for j in journals[:3])
        term = f"({term}) AND ({journal_parts})"
    if universities:
        aff_parts = " OR ".join(f'"{u}"[Affiliation]' for u in universities[:3])
        term = f"({term}) AND ({aff_parts})"

    results = []
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            search_resp = await client.get(PUBMED_ESEARCH, params={
                "db": "pubmed",
                "term": term,
                "retmax": max_results,
                "retmode": "json",
            })
            search_resp.raise_for_status()
            search_data = search_resp.json()
            ids = search_data.get("esearchresult", {}).get("idlist", [])

            if not ids:
                return []

            summary_resp = await client.get(PUBMED_ESUMMARY, params={
                "db": "pubmed",
                "id": ",".join(ids),
                "retmode": "json",
            })
            summary_resp.raise_for_status()
            summary_data = summary_resp.json()
            uids = summary_data.get("result", {}).get("uids", [])

            for uid in uids:
                article = summary_data["result"].get(uid, {})
                title = _clean(article.get("title", "Untitled")).rstrip(".")
                authors = [a.get("name", "") for a in article.get("authors", [])[:5] if a.get("name")]
                journal = article.get("fulljournalname") or article.get("source")
                year = None
                pubdate = article.get("pubdate", "")
                if pubdate:
                    try:
                        year = int(pubdate[:4])
                    except Exception:
                        pass
                doi = None
                for artid in article.get("articleids", []):
                    if artid.get("idtype") == "doi":
                        doi = artid.get("value")
                        break
                url = f"https://pubmed.ncbi.nlm.nih.gov/{uid}/"

                results.append({
                    "doi": doi,
                    "title": title,
                    "authors": authors,
                    "journal": journal,
                    "year": year,
                    "abstract": None,
                    "url": url,
                    "source_db": "PubMed",
                })
    except Exception as e:
        logger.error(f"PubMed search error: {e}")

    return results


async def search_semantic_scholar(
    keywords: str,
    universities: List[str],
    journals: List[str],
    limit: int = 20,
) -> List[Dict]:
    results = []
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(SEMANTIC_SCHOLAR_BASE, params={
                "query": keywords,
                "limit": limit,
                "fields": "title,authors,year,externalIds,venue,abstract,openAccessPdf",
            })
            resp.raise_for_status()
            data = resp.json()
            for paper in data.get("data", []):
                doi = paper.get("externalIds", {}).get("DOI")
                title = _clean(paper.get("title", "Untitled"))
                authors = [a.get("name", "") for a in paper.get("authors", [])[:5] if a.get("name")]
                journal = paper.get("venue")
                year = paper.get("year")
                abstract = paper.get("abstract")
                url = None
                pdf = paper.get("openAccessPdf")
                if pdf:
                    url = pdf.get("url")
                if not url and doi:
                    url = f"https://doi.org/{doi}"

                results.append({
                    "doi": doi,
                    "title": title,
                    "authors": authors,
                    "journal": journal,
                    "year": year,
                    "abstract": abstract,
                    "url": url,
                    "source_db": "Semantic Scholar",
                })
    except Exception as e:
        logger.error(f"Semantic Scholar search error: {e}")

    return results


async def search_core(
    keywords: str,
    universities: List[str],
    journals: List[str],
    limit: int = 20,
) -> List[Dict]:
    results = []
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(CORE_BASE, params={
                "q": keywords,
                "limit": limit,
            })
            resp.raise_for_status()
            data = resp.json()
            for paper in data.get("results", []):
                doi = paper.get("doi")
                title = _clean(paper.get("title", "Untitled"))
                authors = paper.get("authors", [])
                if authors and isinstance(authors[0], dict):
                    authors = [a.get("name", "") for a in authors[:5]]
                elif authors:
                    authors = [str(a) for a in authors[:5]]
                journal = paper.get("journals", [{}])[0].get("title") if paper.get("journals") else None
                year = paper.get("yearPublished")
                abstract = paper.get("abstract")
                url = paper.get("downloadUrl") or paper.get("sourceFulltextUrls", [None])[0]
                if not url and doi:
                    url = f"https://doi.org/{doi}"

                results.append({
                    "doi": doi,
                    "title": title,
                    "authors": authors,
                    "journal": journal,
                    "year": year,
                    "abstract": abstract,
                    "url": url,
                    "source_db": "CORE",
                })
    except Exception as e:
        logger.error(f"CORE search error: {e}")

    return results


async def run_search(config: Any) -> List[Dict]:
    """Run search across selected databases and return deduplicated results."""
    databases = config.databases if config.databases else ["openalex"]
    universities = config.universities or []
    journals = config.journals or []
    keywords = config.keywords

    tasks = []
    db_map = {
        "openalex": lambda: search_openalex(keywords, universities, journals),
        "pubmed": lambda: search_pubmed(keywords, universities, journals),
        "semantic_scholar": lambda: search_semantic_scholar(keywords, universities, journals),
        "core": lambda: search_core(keywords, universities, journals),
    }

    selected = [db_map[db]() for db in databases if db in db_map]
    all_results_nested = await asyncio.gather(*selected, return_exceptions=True)

    seen_dois = set()
    seen_titles = set()
    deduped = []

    for results in all_results_nested:
        if isinstance(results, Exception):
            logger.error(f"Search task error: {results}")
            continue
        for r in results:
            doi = r.get("doi")
            title_key = (r.get("title") or "").lower()[:80]

            if doi and doi in seen_dois:
                continue
            if not doi and title_key and title_key in seen_titles:
                continue

            if doi:
                seen_dois.add(doi)
            if title_key:
                seen_titles.add(title_key)

            deduped.append(r)

    return deduped
