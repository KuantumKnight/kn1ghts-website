# Hero asset notes

`stelae-knight.zip` is the original downloaded package. It contains texture maps and a nested `source/export2k.rar`, but no license or attribution file. The package has not been published through the website.

The current site uses `public/images/knight-poster.png`, generated for KN1GHTS as a temporary project asset, plus a lightweight React Three Fiber atmosphere layer. Replace both when the custom logo and a licensed, web-ready knight model are available.

Before using the downloaded geometry:

1. Record the source URL, creator, and license.
2. Extract and inspect `source/export2k.rar` with a trusted local tool.
3. Convert the selected mesh to GLB, remove unused materials, simplify geometry, and compress textures.
4. Keep the delivered model under 5 MB and verify the poster fallback on mobile and reduced-motion devices.
