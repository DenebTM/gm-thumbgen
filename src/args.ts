import { parseArgs } from 'node:util'

export const { values: args } = parseArgs({
  args: process.argv,
  options: {
    inputBase: {
      type: 'string',
      default: './files',
      short: 'i',
    },
    outputBase: {
      type: 'string',
      default: './thumbs',
      short: 'o',
    },
    urlPrefix: {
      type: 'string',
      default: '/thumbs',
      short: 'p',
    },
    thumbSize: {
      type: 'string',
      default: '512',
      short: 's',
    },
    help: {
      type: 'boolean',
      default: false,
      short: 'h',
    },

    bind: {
      type: 'string',
      default: '[::]:3000',
      short: 'b',
    },
  },
  allowPositionals: true,
})
