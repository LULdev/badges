import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/badge-feed-8Ys_p0VP.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var getBadgeFeed_createServerFn_handler = createServerRpc({
	id: "97c600b8e72543d70258b04d08eb6eca8a7260e5737f7f3fae8ccaaf1fe5f86d",
	name: "getBadgeFeed",
	filename: "src/lib/badge-feed.ts"
}, (opts) => getBadgeFeed.__executeServer(opts));
var getBadgeFeed = createServerFn({ method: "GET" }).handler(getBadgeFeed_createServerFn_handler, async () => {
	const { loadFeed } = await import("./badgebase.server-C6XZCMpk.mjs");
	return loadFeed();
});
//#endregion
export { getBadgeFeed_createServerFn_handler };
