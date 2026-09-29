import urllib.request
import xml.etree.ElementTree as ET
import json
import re
import os
from email.utils import parsedate_to_datetime

# Portales judiciales de Chile
FEEDS = [
    {"name": "Diario Constitucional", "url": "https://www.diarioconstitucional.cl/feed/"},
    {"name": "EstadoDiario", "url": "https://estadodiario.com/feed/"},
    {"name": "En Estrado", "url": "https://enestrado.com/feed/"},
    {"name": "Idealex.press", "url": "https://idealex.press/feed/"}
]

def clean_html(raw_html):
    if not raw_html:
        return ""
    text = re.sub(r"<[^>]+>", "", raw_html)
    text = re.sub(r"\s+", " ", text).strip()
    return text[:140] + "..." if len(text) > 140 else text

def extract_image(item, raw_desc):
    # 1. Enclosure tag
    enc = item.find("enclosure")
    if enc is not None and enc.get("url"):
        return enc.get("url")

    # 2. Etiquetas Media RSS
    for tag in ["{http://search.yahoo.com/mrss/}content", "{http://search.yahoo.com/mrss/}thumbnail"]:
        m = item.find(tag)
        if m is not None and m.get("url"):
            return m.get("url")

    # 3. Imagen embebida en la descripcion
    if raw_desc:
        match = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', raw_desc, re.I)
        if match:
            return match.group(1)

    return ""

def fetch_feed(source):
    articles = []
    try:
        req = urllib.request.Request(
            source["url"],
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) RPAbogadosBot/1.0"}
        )
        with urllib.request.urlopen(req, timeout=12) as response:
            xml_data = response.read()
            root = ET.fromstring(xml_data)

            for item in root.findall(".//item")[:5]:
                title = item.find("title").text if item.find("title") is not None else ""
                link = item.find("link").text if item.find("link") is not None else ""
                pub_date_str = item.find("pubDate").text if item.find("pubDate") is not None else ""
                desc = item.find("description").text if item.find("description") is not None else ""
                image_url = extract_image(item, desc)

                try:
                    dt = parsedate_to_datetime(pub_date_str)
                    iso_date = dt.isoformat()
                    timestamp = dt.timestamp()
                except Exception:
                    iso_date = ""
                    timestamp = 0

                if title and link:
                    articles.append({
                        "source": source["name"],
                        "title": title.strip(),
                        "link": link.strip(),
                        "date": iso_date,
                        "timestamp": timestamp,
                        "snippet": clean_html(desc),
                        "image": image_url
                    })
    except Exception as e:
        print(f"Error consultando {source['name']}: {e}")
    return articles

def main():
    all_articles = []
    for source in FEEDS:
        print(f"Descargando {source['name']}...")
        all_articles.extend(fetch_feed(source))

    all_articles.sort(key=lambda x: x["timestamp"], reverse=True)
    top_articles = all_articles[:9]

    os.makedirs("public", exist_ok=True)
    output_path = os.path.join("public", "noticias.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(top_articles, f, ensure_ascii=False, indent=2)

    print(f"Actualizacion exitosa: {len(top_articles)} noticias guardadas en {output_path}.")

if __name__ == "__main__":
    main()
