import { useState } from "react";
import * as Icons from "react-bootstrap-icons";

function FileUpload() {
  const [showModal, setShowModal] = useState(false);
  const [file, setFile] = useState(null);

  const handleFileSelect = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://127.0.0.1:8000/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      alert(data.message || data.detail);
      setShowModal(false);
      setFile(null);
    } catch (err) {
      alert("Upload failed: " + err.message);
    }
  };

  return (
    <>
      <div className="topsection2">
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Icons.Plus size={20} /> Add File
          </button>
        </div>
      

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setShowModal(false)}>
              &times;
            </span>
            <input type="file" onChange={handleFileSelect} />
            <button className="btn btn-primary" onClick={handleUpload}>
              Upload
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default FileUpload;