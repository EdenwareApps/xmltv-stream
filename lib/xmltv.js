import sax from 'sax'
import { Writable } from 'stream'
import moment from 'moment'

// mapping of XML field names to object property names
const PROGRAMME_MULTI_FIELDS = Object.freeze({
    title: 'title',
    'sub-title': 'secondaryTitle',
    desc: 'desc',
    descgen: 'descgen',
    category: 'category',
    country: 'country'
})

// mapping of credit-related XML tags to object property names
const CREDITS_FIELDS = Object.freeze({
    actor: 'actor',
    director: 'director',
    producer: 'producer',
    presenter: 'presenter'
})

// mapping of image-related XML tags to object property names
const IMAGE_FIELDS = Object.freeze({
    'large-image-url': 'large',
    'medium-image-url': 'medium',
    'small-image-url': 'small'
})

// conversion factors for length units
const LENGTH_UNITS = Object.freeze({
    seconds: 1,
    minutes: 60,
    hours: 3600
})

// represents a single channel entry
class Channel {
    constructor() {
        this.name = null
        this.icon = null
    }
}

// represents a single programme entry
export class Programme {
    constructor() {
        this.channel = null
        this.start = null
        this.end = null
        this.length = null
        this.title = []
        this.secondaryTitle = []
        this.desc = []
        this.descgen = []
        this.category = []
        this.country = []
        this.rating = []
        this.episodeNum = []
        this.credits = []
        this.images = []
        this.date = null
    }

    // parses the season number from the episode number string (xmltv_ns format)
    getSeason(epNum) {
        epNum = epNum || this.episodeNum.find(item => item.system === 'xmltv_ns')?.value
        if (!epNum) return null

        const [seasonPart] = epNum.split('.')
        if (!seasonPart) return null

        const seasonNum = parseInt(seasonPart.split('/')[0].trim(), 10)
        return Number.isNaN(seasonNum) ? null : seasonNum + 1
    }
}

// main parser class for XMLTV
export class Parser extends Writable {
    constructor(options = {}) {
        super()
        this.options = {
            timeFmt: options.timeFmt || 'YYYYMMDDHHmmss Z',
            outputTimeFmt: options.outputTimeFmt || null,
            strictTime: options.strictTime ?? true
        }

        const parserOptions = { trim: true, position: false, lowercase: true }
        this.xmlParser = sax.createStream(true, parserOptions)
        this.xmlParser.on('end', this.emit.bind(this, 'end'))
        this.xmlParser.on('error', this.emit.bind(this, 'error'))

        let programme = null, channel = null, currentNode = null

        this.xmlParser.on('opentag', node => {
            node.parentNode = currentNode
            currentNode = node

            switch (node.name) {
                case 'channel':
                    channel = new Channel()
                    channel.name = node.attributes.id
                    break
                case 'programme':
                    programme = new Programme()
                    programme.channel = node.attributes.channel
                    programme.start = this.parseDate(node.attributes.start)
                    programme.end = this.parseDate(node.attributes.stop) // not mandatory but usually present
                    break
            }
        })

        this.xmlParser.on('closetag', tagName => {
            if (tagName === 'programme') {
                this.emit('programme', programme)
                programme = null
            } else if (tagName === 'channel') {
                this.emit('channel', channel)
                channel = null
            }
            // restores the parent node as the current node
            currentNode = currentNode.parentNode
        })

        this.xmlParser.on('text', text => {
            if (!currentNode) return

            if (currentNode.name === 'display-name' && channel) {
                channel.displayName = text
            } else if (programme) {
                if (PROGRAMME_MULTI_FIELDS[currentNode.name]) {
                    programme[PROGRAMME_MULTI_FIELDS[currentNode.name]].push(text)
                } else if (CREDITS_FIELDS[currentNode.name]) {
                    programme.credits.push({
                        type: currentNode.name,
                        role: currentNode.name === 'actor' ? currentNode.attributes.role || null : null,
                        name: text
                    })
                } else if (IMAGE_FIELDS[currentNode.name]) {
                    programme.images.push({ size: IMAGE_FIELDS[currentNode.name], url: text })
                } else if (currentNode.name === 'length' && LENGTH_UNITS[currentNode.attributes.units]) {
                    programme.length = parseInt(text, 10) * LENGTH_UNITS[currentNode.attributes.units]
                } else if (currentNode.name === 'episode-num') {
                    programme.episodeNum.push({ system: currentNode.attributes.system, value: text })
                } else if (currentNode.parentNode?.name === 'rating' && currentNode.name === 'value') {
                    programme.rating.push({ system: currentNode.parentNode.attributes.system, value: text })
                }
            }
        })

        // closes the SAX parser when the writable stream ends
        this.on('finish', () => this.xmlParser.end())
    }

    _write(chunk, encoding, callback) {
        this.xmlParser.write(chunk, encoding)
        callback()
    }

    // parses a date string and returns a Date object or null if invalid
    parseDate(date) {
        const parsed = moment(date, this.options.timeFmt, this.options.strictTime)
        return parsed.isValid() ? (this.options.outputTimeFmt ? parsed.format(this.options.outputTimeFmt) : parsed.toDate()) : null
    }
}

export default { Parser, Programme }