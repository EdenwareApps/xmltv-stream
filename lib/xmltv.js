import sax from 'sax'
import { Writable } from 'stream'

// Mapping XML fields to object properties
const PROGRAMME_MULTI_FIELDS = Object.freeze({
    title: 'title',
    'sub-title': 'secondaryTitle',
    desc: 'desc',
    descgen: 'descgen',
    category: 'category',
    country: 'country'
})

// Mapping new fields for parsing
const EXTRA_FIELDS = Object.freeze({
    subtitles: 'subtitles',
    'star-rating': 'starRating',
    url: 'url',
    video: 'video',
    audio: 'audio',
    'previously-shown': 'previouslyShown',
    premiere: 'premiere',
    'last-chance': 'lastChance',
    'new': 'isNew',
    review: 'review'
})

// Mapping credits fields
const CREDITS_FIELDS = Object.freeze({
    actor: 'actor',
    director: 'director',
    producer: 'producer',
    presenter: 'presenter'
})

// Mapping image fields
const IMAGE_FIELDS = Object.freeze({
    'large-image-url': 'large',
    'medium-image-url': 'medium',
    'small-image-url': 'small'
})

// Conversion factors for length units
const LENGTH_UNITS = Object.freeze({
    seconds: 1,
    minutes: 60,
    hours: 3600
})

const TIMEZONE_ADJUST_REGEX = new RegExp("([+-]\\d{2}):?(\\d{2})$")

// Represents a channel entry
class Channel {
    constructor() {
        this.name = null
        this.icon = null
        this.displayName = null // initializes with null to avoid redundant checks
    }
}

// Represents a programme entry
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
        this.subtitles = []
        this.starRating = []
        this.url = []
        this.video = []
        this.audio = []
        this.previouslyShown = false
        this.premiere = false
        this.lastChance = false
        this.isNew = false
        this.review = []
    }

    /**
     * Parses episodeNum with xmltv_ns system format and returns the season number
     *
     * xmltv_ns format lookgs like this:
     * season[/total] . episode-num[/total] . episode-part[/total]
     * If the number is not included it's unknown.
     * So: "1.4/5." - is episode 5 out of 5 of season 2.
     * And: "0.0.0/2" - is part 1 of episode 1 of season 1
     * (The count starts from 0)
     *
     * If no arguments are given it looks for the episode number in the episodeNum
     * attribute.
     */
    getSeason(epNum) {
        if(!epNum) epNum = this.episodeNum.find(item => item.system === 'xmltv_ns')?.value
        if (!epNum) return null

        const parts = epNum.split('.')
        if (parts.length !== 3) return null
        const seasonPart = parts[0]
        const seasonNum = parseInt(seasonPart.split('/')[0].trim(), 10)
        if (seasonPart.length !== 0) {
            return Number(seasonNum) + 1
        }
        return null
    }
}

// main parser class for XMLTV
export class Parser extends Writable {
    constructor(opts = {}) {
        super()
        this.opts = Object.assign({
            parseDate: null,
            silent: true
        }, opts)

        const parserOpts = { trim: true, position: false, lowercase: true }
        this.xmlParser = sax.createStream(true, parserOpts)
        this.xmlParser.on('end', this.emit.bind(this, 'end'))
        this.xmlParser.on('error', err => {
            if (!this.opts.silent) {
                if(this.listenerCount('error')) {
                    this.emit('error', err)
                } else {
                    console.error(err)
                }
            }
        })

        let programme = null, channel = null, currentNode = null

        this.xmlParser.on('opentag', node => {
            node.parentNode = currentNode
            currentNode = node

            switch (node.name) {
                case 'channel':
                    channel = new Channel()
                    channel.name = node.attributes.id
                    break
                case 'display-name':
                    this.currentDisplay = { target: channel || programme }
                    break
                case 'icon':
                    if(programme) {
                        programme.icon = node.attributes.src
                    } else if(channel){
                        channel.icon = node.attributes.src
                    }
                    break
                case 'programme':
                    programme = new Programme()
                    programme.channel = node.attributes.channel
                    programme.start = this.parseDate(node.attributes.start)
                    programme.end = this.parseDate(node.attributes.stop) // not mandatory, but usually present
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

            if (this.currentDisplay && text.trim()) {
                this.currentDisplay.target.displayName = text
                this.currentDisplay = null
            } else if (programme) {
                if (PROGRAMME_MULTI_FIELDS[currentNode.name]) {
                    if (text.trim()) {
                        programme[PROGRAMME_MULTI_FIELDS[currentNode.name]].push(text)
                    }
                } else if (CREDITS_FIELDS[currentNode.name]) {
                    programme.credits.push({
                        type: currentNode.name,
                        role: currentNode.name === 'actor' ? currentNode.attributes.role || null : null,
                        name: text
                    })
                } else if (IMAGE_FIELDS[currentNode.name]) {
                    programme.images.push({ size: IMAGE_FIELDS[currentNode.name], url: text })
                } else if (EXTRA_FIELDS[currentNode.name]) {
                    if (Array.isArray(programme[EXTRA_FIELDS[currentNode.name]])) {
                        programme[EXTRA_FIELDS[currentNode.name]].push(text)
                    } else {
                        programme[EXTRA_FIELDS[currentNode.name]] = text.trim().toLowerCase() === 'true' || text.trim() === 'yes'
                    }
                } else if (currentNode.name === 'length' && LENGTH_UNITS[currentNode.attributes.units]) {
                    programme.length = parseInt(text, 10) * LENGTH_UNITS[currentNode.attributes.units]
                } else if (currentNode.name === 'episode-num') {
                    programme.episodeNum.push({ system: currentNode.attributes.system, value: text })
                } else if (currentNode.parentNode?.name === 'rating' && currentNode.name === 'value') {
                    programme.rating.push({ system: currentNode.parentNode.attributes.system, value: text })
                }
            }
        })

        // closes the SAX parser when the stream finishes
        this.on('finish', () => this.xmlParser.end())
    }

    _write(chunk, encoding, callback) {
        this.xmlParser.write(chunk, encoding)
        callback()
    }

    // parses a date string and returns a Date object or null if invalid
    parseDate(dateStr) {
        if(this.opts.parseDate) return this.opts.parseDate(dateStr)
        try {
            // check for timezone in format +HHMM or +HH:MM
            const tzMatch = dateStr.match(TIMEZONE_ADJUST_REGEX)
            const timezoneOffset = tzMatch ? (tzMatch[1] +':'+ tzMatch[2]) : 'Z'

            if(tzMatch) {
                dateStr = dateStr.substr(0, (dateStr.length - tzMatch[0].length) - 1)  // remove timezone from date string
            }

            // default values
            const year = dateStr.slice(0, 4),
                month = dateStr.slice(4, 6) || '01',
                day = dateStr.slice(6, 8) || '01',
                hour = dateStr.slice(8, 10) || '00',
                minute = dateStr.slice(10, 12) || '00',
                second = dateStr.slice(12, 14) || '00'
            
            // build the ISO 8601 formatted string
            const isoString = `${year}-${month}-${day}T${hour}:${minute}:${second}${timezoneOffset}`
            if(this.opts.timestamps) {
                const ret = Date.parse(isoString)
                return isNaN(ret) ? null : (ret / 1000)
            } else {
                const ret = new Date(isoString)
                if(ret instanceof Date && !isNaN(ret)) {
                    return ret
                }
            }
        } catch (e) {
            if (!this.opts.silent) {
                if(this.listenerCount('error')) {
                    this.emit('error', e)
                } else {
                    console.error(e)
                }
            }
        }
        return null
    }

}
