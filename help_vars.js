const log = true;
const transitions = {
	"up" : {
		"up" : "up",
		"down" : "down_left",
		"left" : "up_left",
		"right" : "up_right",
		"down_left" : "left",
		"down_right" : "right",
		"up_left" : "up",
		"up_right" : "up"
	},
	"down" : {
		"up" : "up_left",
		"down" : "down",
		"left" : "down_left",
		"right" : "down_right",
		"down_left" : "down",
		"down_right" : "down",
		"up_left" : "left",
		"up_right" : "right"
	},
	"left" : {
		"up" : "up_left",
		"down" : "down_left",
		"left" : "left",
		"right" : "up_right",
		"down_left" : "left",
		"down_right" : "down",
		"up_left" : "left",
		"up_right" : "up"
	},
	"right" : {
		"up" : "up_right",
		"down" : "down_right",
		"left" : "up_left",
		"right" : "right",
		"down_left" : "down",
		"down_right" : "right",
		"up_left" : "up",
		"up_right" : "right"
	},
	"down_left" : {
		"up" : "up_left",
		"down" : "down_left",
		"left" : "down_left",
		"right" : "down_right",
		"down_left" : "down_left",
		"down_right" : "down",
		"up_left" : "left",
		"up_right" : "up"
	},
	"down_right" : {
		"up" : "up_right",
		"down" : "down_right",
		"left" : "down_left",
		"right" : "down_right",
		"down_left" : "down",
		"down_right" : "down_right",
		"up_left" : "left",
		"up_right" : "right"
	},
	"up_left" : {
		"up" : "up_left",
		"down" : "down_left",
		"left" : "up_left",
		"right" : "up_right",
		"down_left" : "left",
		"down_right" : "right",
		"up_left" : "up_left",
		"up_right" : "up"
	},
	"up_right" : {
		"up" : "up_right",
		"down" : "down_right",
		"left" : "up_left",
		"right" : "up_right",
		"down_left" : "left",
		"down_right" : "right",
		"up_left" : "up",
		"up_right" : "up_right"
	},
};