import urllib.request
import xml.etree.ElementTree as ET
import json
import re
import os
from email.utils import parsedate_to_datetime

# Principales portales judiciales y legales de Chile
FEEDS = [
    {"name": "Diario Constitucional", "url": "https://www.diarioconstitucional.cl/feed/"},
    {"name": "Estado Diario", "url": "https://estadodiario.com/feed/"},
    {"name": "En Estrado", "url": "https://enestrado.com/feed/"},
    {"name": "Idealex.press", "url": "https://idealex.press/feed/"},
    {"name": "Microjuris Chile", "url": "https://aldia.microjuris.com/feed/"},
    {"name": "Palabras del Derecho", "url": "https://palabrasdelderecho.com/feed/"}
]

def clean_html(raw_html):
    if not raw_html:
        return ""
    text = re.sub(r"<[^>]+>", "", raw_html)
    text = re.sub(r"\s+", " ", text).strip()
    return text[:140] + "..." if len(text) > 140 else text

def fetch_og_image(link):
    """Extrae la imagen original de la nota desde sus metadatos Open Graph"""
    if not link:
        return ""
    try:
        req = urllib.request.Request(
            link,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"}
        )
        with urllib.request.urlopen(req, timeout=6) as response:
            html = response.read().decode('utf-8', errors='ignore')
            m = re.search(r'<meta[^>]+(?:property|name)=["\'](?:og:image|twitter:image)["\'][^>]+content=["\']([^"\']+)["\']', html, re.I)
            if not m:
                m = re.search(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:property|name)=["\'](?:og:image|twitter:image)["\']', html, re.I)
            if m:
                return m.group(1).strip()
    except Exception:
        pass
    return ""

def extract_image(item, raw_desc, link):
    # 1. Enclosure tag
    enc = item.find("enclosure")
    if enc is not None and enc.get("url"):
        return enc.get("url")

    # 2. Etiquetas Media RSS
    for tag in ["{http://search.yahoo.com/mrss/}content", "{http://search.yahoo.com/mrss/}thumbnail"]:
        m = item.find(tag)
        if m is not None and m.get("url"):
            return m.get("url")

    # 3. WordPress content:encoded
    content_enc = item.find("{http://purl.org/rss/1.0/modules/content/}encoded")
    if content_enc is not None and content_enc.text:
        match = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', content_enc.text, re.I)
        if match:
            return match.group(1)

    # 4. Imagen en descripción
    if raw_desc:
        match = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', raw_desc, re.I)
        if match:
            return match.group(1)

    # 5. Extracción directa de la web original
    og_img = fetch_og_image(link)
    if og_img:
        return og_img

    return "/fotos/fondo-hormigon.jpg?v=2"

def fetch_feed(source):
    articles = []
    try:
        req = urllib.request.Request(
            source["url"],
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"}
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            xml_data = response.read()
            root = ET.fromstring(xml_data)

            for item in root.findall(".//item")[:5]:
                title = item.find("title").text if item.find("title") is not None else ""
                link = item.find("link").text if item.find("link") is not None else ""
                pub_date_str = item.find("pubDate").text if item.find("pubDate") is not None else ""
                desc = item.find("description").text if item.find("description") is not None else ""
                
                clean_link = link.strip() if link else ""
                image_url = extract_image(item, desc, clean_link)

                try:
                    dt = parsedate_to_datetime(pub_date_str)
                    iso_date = dt.isoformat()
                    timestamp = dt.timestamp()
                except Exception:
                    iso_date = ""
                    timestamp = 0

                if title and clean_link:
                    articles.append({
                        "source": source["name"],
                        "title": title.strip(),
                        "link": clean_link,
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

    # Ordenar por fecha reciente y seleccionar notas variadas de todos los medios
    all_articles.sort(key=lambda x: x["timestamp"], reverse=True)
    
    # Asegurar diversidad de fuentes en los primeros resultados
    selected = []
    seen_sources = {}
    for a in all_articles:
        s = a["source"]
        if seen_sources.get(s, 0) < 2:  # Máximo 2 notas por medio para dar cabida a todos
            selected.append(a)
            seen_sources[s] = seen_sources.get(s, 0) + 1
        if len(selected) == 6:
            break
            
    # Si faltan para completar 6, rellenar con las más recientes
    if len(selected) < 6:
        for a in all_articles:
            if a not in selected:
                selected.append(a)
            if len(selected) == 6:
                break

    os.makedirs("public", exist_ok=True)
    output_path = os.path.join("public", "noticias.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(selected, f, ensure_ascii=False, indent=2)

    print(f"Actualización exitosa: {len(selected)} noticias de diversos medios guardadas en {output_path}.")

if __name__ == "__main__":
    main()
