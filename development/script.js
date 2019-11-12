
let oReq = new XMLHttpRequest();
oReq.open("GET", "./E020N40.DEM", true);
oReq.responseType = "arraybuffer";

oReq.onload = function (oEvent) {
	let arrayBuffer = oReq.response; // Note: not oReq.responseText
	if (arrayBuffer) {
		let dem = new Int8Array(arrayBuffer);

		let req = new XMLHttpRequest();
		req.open("GET", "./gt30e020n40.src", true);
		req.responseType = "arraybuffer";
		req.onload = function(event) {
			let buff = req.response;
			if (buff) {
				let src = new Int8Array(buff);
				let map = new Map(dem, src);
			}
		};

		req.send(null);
	}
};

oReq.send(null);
