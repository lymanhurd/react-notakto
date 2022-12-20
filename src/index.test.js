import React from 'react'
import ReactDOM from 'react-dom'
import { render } from '@testing-library/react';

let container = null
beforeEach(() => {
  // setup a DOM element as a render target
  container = document.createElement('div')
  container.setAttribute("id", "root")
  document.body.appendChild(container)
})

afterEach(() => {
  // cleanup on exiting
  ReactDOM.unmountComponentAtNode(container)
  container.remove()
  container = null
})

import Game from './index';

describe('Game', () => {
  it('renders Game component', () => {
    render(<Game />);
  });
});