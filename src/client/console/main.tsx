import React from 'react'
import ReactDOM from 'react-dom/client'
import { Console } from './console'
import './console.css'

const rootElement = document.getElementById('root')
if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
            <Console />
        </React.StrictMode>
    )
}
