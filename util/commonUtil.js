const charArr = [
'0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 
'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 
'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 
'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

module.exports = {
	generateRandomName: function () {
		var randomName = "";
		for (var i = 0; i < 10; i++) {
			randomName += charArr[parseInt(Math.random() * charArr.length)];
		}
		return randomName;
	},

	checkMobileNumber: function (mobile_number) {
    	if(!(/^1[34578]\d{9}$/.test(mobile_number))){ 
        	return false;
    	} else {
    		return true;
    	}
	}
}