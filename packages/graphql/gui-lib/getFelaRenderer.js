import { createRenderer } from 'fela'
import webPreset from 'fela-preset-web'
import friendlyPseudoClass from 'fela-plugin-friendly-pseudo-class'
import monolithic from 'fela-monolithic'

export default function getRenderer () {
  const plugins = [
    ...webPreset,
    friendlyPseudoClass()
  ];

  const enhancers = [];

  if (process.env.NODE_ENV !== 'production') {
    enhancers.push(monolithic())
  }

  const renderer = createRenderer({
    plugins,
    enhancers,
    selectorPrefix: '_'
  })

  return renderer;
}
