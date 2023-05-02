import {merge} from 'webpack-merge';
import {commonConfiguration, __dirname} from './webpack.common.js';
import portFinderSync from 'portfinder-sync';
import path from 'path';
import {internalIpV4Sync} from 'internal-ip';

const infoColor = (_message) =>
{
    return `\u001b[1m\u001b[34m${_message}\u001b[39m\u001b[22m`
}

export default merge(
    commonConfiguration,
    {
        mode: 'development',
        devServer:
        {
            host: '0.0.0.0',
            port: portFinderSync.getPort(8080),
            static: {
				directory: path.resolve(__dirname, '../dist'),
            	watch: true
			},
            open: true,
            https: false,
			host: "local-ip",
			allowedHosts: "all",
			client: {
	            overlay: true
			},
//            noInfo: true,
            setupMiddlewares: function(middlewares, devServer)
            {
				middlewares.push({
					name:'middleware-after',
					middleware: (req, res) => {							
						const port = devServer.options.port
						const https = devServer.options.https ? 's' : ''
						const localIp = internalIpV4Sync()
						const domain1 = `http${https}://${localIp}:${port}`
						const domain2 = `http${https}://localhost:${port}`					
						console.log(`Project running at:\n  - ${infoColor(domain1)}\n  - ${infoColor(domain2)}`)
					}
				});
				return middlewares;
            }
        }
    }
)
