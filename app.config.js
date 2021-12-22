module.exports = {
	apps: [
		{
			name: "All-Sports",
			script: "./app.js",
			instances: "1",
			exec_mode: "cluster",
			watch: true,
			watch_delay: 1000,
			ignore_watch: ["node_modules", "server/public"],
			env: {
				PORT: "3000",
			},
		},
	],
};