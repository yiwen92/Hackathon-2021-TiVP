import { Root } from '@lib/components'
import React from 'react'
import { HashRouter as Router, Route, Routes } from 'react-router-dom'
import ListPage from './pages/List'
import ListChannelsPage from './pages/ListChannels'
import CreateChannelPage from './pages/CreateChannel'
import UpdateChannelPage from './pages/UpdateChannel'

const App = () => {
  return (
    <Root>
      <Router>
        <Routes>
          <Route path="/alerts" element={<ListPage />} />
          <Route path="/alerts/channels" element={<ListChannelsPage />} />
          <Route
            path="/alerts/channels/create"
            element={<CreateChannelPage />}
          />
          <Route
            path="/alerts/channels/update"
            element={<UpdateChannelPage />}
          />
        </Routes>
      </Router>
    </Root>
  )
}

export default App
