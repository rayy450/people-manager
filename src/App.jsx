import './App.css'
import * as Icons from 'react-bootstrap-icons'
import UserTable from './UserTable'
import { useState, useRef } from 'react'
import FileUpload from './fileupload'

function App() {
  const [showModal, setShowModal] = useState(false)
  const [newUser, setNewUser] = useState(null)
  const nameRef = useRef(null)
  const ageRef = useRef(null)
  const [search, setSearch] = useState('')

  const handleAddUser = async () => {
    const name = nameRef.current.value.trim()
    const age = parseInt(ageRef.current.value)
    if (!name || isNaN(age)) return

    try {
      const res = await fetch('http://127.0.0.1:8000/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, age }),
      })
      if (res.ok) {
        const created = await res.json()
        setNewUser(created)          
        setShowModal(false)
        nameRef.current.value = ''
        ageRef.current.value = ''
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div>
      <div className="App">
        <div className="container">
          <header className="top-header">
            <div className="topsection"><Icons.PeopleFill size={60} /></div>
            <div className="topsection1">
              <h2>People Manager</h2>
              <h3>Manage your contacts with ease</h3>
            </div>
            <div className="topsection2">
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                <Icons.Plus size={20} /> Add User
              </button>
            </div>
            <div>
              <FileUpload />
            </div>
          </header>
        </div>
      </div>

      <div className="search-bar">
        <Icons.Search size={20} />
        <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      
      <UserTable newUser={newUser} search={search} />


      {showModal && (
        <div className="modal" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add User</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <Icons.X size={22} />
              </button>
            </div>
            <div className="form-group">
              <label>Name</label>
              <input ref={nameRef} type="text" placeholder="Enter name" />
            </div>
            <div className="form-group">
              <label>Age</label>
              <input ref={ageRef} type="number" placeholder="Enter age"/>
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="add-btn" onClick={handleAddUser}>Add User</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App