import * as Icons from 'react-bootstrap-icons'
import './UserTable.css'
import { useState, useEffect } from 'react'

function UserTable({ newUser, search }) {
  const [users, setUsers] = useState([])

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/users')
        if (res.ok) {
          const data = await res.json()
          setUsers(data)
        }
      } catch (err) {
        console.error(err)
      }
    }

    fetchUsers()
  }, [])

  useEffect(() => {
    if (newUser) {
      setUsers(prev => [...prev, newUser])
    }
  }, [newUser])

    const handleDelete = async (id) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/users/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setUsers(prev => prev.filter(user => user.id !== id))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleEdit = (user) => {
    const newName = prompt('Enter new name:', user.name)
    const newAge = prompt('Enter new age:', user.age)
    if (newName !== null && newAge !== null) {
      const updatedUser = { ...user, name: newName, age: parseInt(newAge) }
      setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u))
    }
  }

  return (
    <div className="table-container">

      <table className="user-table">
        <thead>
          <tr>
            <th style={{ width: '80px' }}>ID</th>
            <th>USER</th>
            <th>AGE</th>  
            <th>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {users
          .filter(user => user.name.toLowerCase().includes(search.toLowerCase()))
          .map(user => (
            <tr key={user.id}>
              <td className="id-cell">#{user.id}</td>
              <td>
                <div className="user-profile-cell">
                  <span className="user-name">{user.name}</span>
                </div>
              </td>
              
              <td>{user.age}</td>
              <td>
                <div className="action-buttons">
                  <span className="edit-icon" onClick={() => handleEdit(user)}>
                    <Icons.Pencil size={16} />
                  </span>
                  <span className="delete-icon" onClick={() => handleDelete(user.id)}>
                    <Icons.Trash size={16} />
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="table-footer">
        Showing {users.length} of {users.length} users
      </div>
    </div>
  )
}

export default UserTable