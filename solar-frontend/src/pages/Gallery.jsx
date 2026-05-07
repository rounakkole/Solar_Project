import { useState } from "react";
import styles from "./Gallery.module.css";

export default function Gallery() {

  const [selectedImg, setSelectedImg] = useState(null);
  const [filter, setFilter] = useState("All");

  const images = [
    { src: "/images/solar1.jpg", type: "Residential", title: "Home Rooftop - Pune" },
    { src: "/images/solar2.jpg", type: "Residential", title: "House Installation - Nashik" },
    { src: "/images/solar3.jpg", type: "Commercial", title: "Office Setup - Mumbai" },
    { src: "/images/solar4.jpg", type: "Industrial", title: "Factory Plant - Satara" },
    { src: "/images/solar5.jpg", type: "Residential", title: "Terrace Solar - Sangli" },
    { src: "/images/solar6.jpg", type: "Commercial", title: "Shop Installation" },
    { src: "/images/solar7.jpg", type: "Residential", title: "Apartment Solar" },
    { src: "/images/solar8.jpg", type: "Industrial", title: "Warehouse Solar" },
    { src: "/images/solar9.jpg", type: "Residential", title: "Rooftop Setup" },
    { src: "/images/solar10.jpg", type: "Commercial", title: "Building Solar" },
    { src: "/images/solar11.jpg", type: "Residential", title: "Home System" },
    { src: "/images/solar12.jpg", type: "Industrial", title: "Large Grid Setup" },
    { src: "/images/solar13.jpg", type: "Residential", title: "Modern Solar Roof" },
    { src: "/images/solar14.jpg", type: "Commercial", title: "Office Panel Setup" },
    { src: "/images/solar15.jpg", type: "Residential", title: "Clean Energy Home" },
    { src: "/images/solar16.jpg", type: "Industrial", title: "Heavy Duty Panels" },
    { src: "/images/solar17.jpg", type: "Residential", title: "City Rooftop Solar" },
    { src: "/images/solar18.jpg", type: "Commercial", title: "Business Installation" },
    { src: "/images/solar19.jpg", type: "Residential", title: "Solar Terrace View" },
    { src: "/images/solar20.jpg", type: "Industrial", title: "High Capacity Plant" },
  ];

  const filteredImages =
    filter === "All" ? images : images.filter(img => img.type === filter);

  return (
    <div className={styles.page}>

      <h1 className={styles.title}>🌞 Our Solar Projects</h1>

      {/* FILTER BUTTONS */}
      <div className={styles.filters}>
        {["All", "Residential", "Commercial", "Industrial"].map(f => (
          <button
            key={f}
            className={filter === f ? styles.active : ""}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* IMAGE GRID */}
      <div className={styles.grid}>
        {filteredImages.map((img, i) => (
          <div key={i} className={styles.card}>
            <img src={img.src} alt="solar" onClick={() => setSelectedImg(img)} />
            <div className={styles.overlay}>
              <p>{img.title}</p>
              <span>{img.type}</span>
            </div>
          </div>
        ))}
      </div>

      {/* FULL SCREEN MODAL */}
      {selectedImg && (
        <div className={styles.modal} onClick={() => setSelectedImg(null)}>
          <img src={selectedImg.src} alt="preview" />
          <p>{selectedImg.title}</p>
        </div>
      )}

    </div>
  );
}