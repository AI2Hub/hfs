import { VfsNode, walkNode } from './vfs'
import Koa from 'koa'
import { filterMapGenerator } from './misc'
import { QuickZipStream } from './QuickZipStream'
import { createReadStream } from 'fs'
import fs from 'fs/promises'

export async function zipStreamFromFolder(node: VfsNode, ctx: Koa.Context) {
    ctx.status = 200
    ctx.mime = 'zip'
    const { name } = node
    ctx.attachment((name || 'archive') + '.zip')
    const walker = filterMapGenerator(walkNode(node, ctx, Infinity), async (el:VfsNode) => {
        if (!el.source || ctx.req.aborted)
            return
        try {
            const st = await fs.stat(el.source)
            if (!st || !st.isFile())
                return
            return { path:el.name, size:st.size, ts:st.mtime||st.ctime, data: createReadStream(el.source) }
        }
        catch(e) {}

    })
    ctx.body = new QuickZipStream(walker)
}