import { Root } from '@lib/components'
import React from 'react'
import { HashRouter as Router, Route, Routes } from 'react-router-dom'
import ListPage from './pages/List'

const App = () => {
  return (
    <Root>
      <Router>
        <Routes>
          <Route path="/alerts" element={<ListPage />} />
          <Route path="/alerts/channels" element={<ListPage />} />
        </Routes>
      </Router>
    </Root>
  )
}

export default App
