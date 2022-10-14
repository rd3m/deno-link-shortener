import { serve } from "https://deno.land/std@0.155.0/http/server.ts";
import { connect } from "https://deno.land/x/redis/mod.ts";


const redis = await connect({
    hostname: Deno.env.get("upstash-endpoint"),
    port: Deno.env.get("upstash-port"),
    password: Deno.env.get("upstash-password")
});

const validateUrl = (url: string): boolean => {
    let test: URL | string
    try {
        test = new URL(url)
    } catch {
        return false
    }
    return true
}

const handler = async (request: Request): Promise<Response> => {
    const url = new URL(request.url)
    const create = url.searchParams.get("create")
    const link = await redis.get(url.pathname);

    if (link) {
        return Response.redirect(link, 302);
    }

    if (create) {
        if (!validateUrl(create)) {
            return new Response("Invalid url, make sure to include https://", { status: 400 });
        }
        const code = crypto.randomUUID().split('-')[0]
        const success = await redis.set(`/${code}`, create)
        if (success) {
            return new Response(`Link to "${create}" added successfully. You can now use ${url.origin}/${code}`, { status: 200 });
        }
    }

    if (url.pathname === "/") {
        return new Response(`To create a short link, go to ${url.origin}/?create=link_to_shorten `, { status: 200 });
    }

    return new Response("URL not found", { status: 400 });
};

await serve(handler)