import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import List, Dict, Any
import os

logger = logging.getLogger(__name__)

SMTP_HOST = os.getenv("SMTP_HOST", "localhost")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
SMTP_FROM = os.getenv("SMTP_FROM", "literature-search@example.com")


def send_results_email(
    to_email: str,
    config_name: str,
    keywords: str,
    results: List[Dict[str, Any]],
) -> bool:
    if not results:
        return True

    subject = f"Literature Search Results: {keywords[:60]}"
    html_parts = [
        f"<h2>New Literature Search Results</h2>",
        f"<p><strong>Search:</strong> {keywords}</p>",
        f"<p><strong>Config:</strong> {config_name}</p>",
        f"<p><strong>New results found:</strong> {len(results)}</p>",
        "<hr>",
    ]

    for r in results[:20]:
        title = r.get("title", "Untitled")
        authors = ", ".join(r.get("authors", [])[:3])
        if len(r.get("authors", [])) > 3:
            authors += " et al."
        journal = r.get("journal", "")
        year = r.get("year", "")
        abstract = (r.get("abstract") or "")[:300]
        if len(r.get("abstract") or "") > 300:
            abstract += "..."
        url = r.get("url", "")
        doi = r.get("doi", "")

        html_parts.append(f"""
        <div style="margin-bottom:20px; padding:15px; border:1px solid #e0e0e0; border-radius:6px;">
            <h3 style="margin:0 0 8px 0; color:#1e3a8a;">{title}</h3>
            <p style="margin:4px 0; color:#555;">{authors}</p>
            <p style="margin:4px 0; color:#777;">{journal} {year}</p>
            {f'<p style="margin:4px 0;">{abstract}</p>' if abstract else ''}
            {f'<p style="margin:4px 0;"><a href="{url}">View paper</a></p>' if url else ''}
            {f'<p style="margin:4px 0; font-size:12px; color:#999;">DOI: {doi}</p>' if doi else ''}
        </div>
        """)

    html_body = "\n".join(html_parts)

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = SMTP_FROM
        msg["To"] = to_email
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            if SMTP_USER and SMTP_PASS:
                server.starttls()
                server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_FROM, to_email, msg.as_string())

        logger.info(f"Email sent to {to_email} with {len(results)} results")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        return False
