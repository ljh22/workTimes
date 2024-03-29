let workTime = [];
let weekendArr = []; //周末数据

let WorkStartTimeArray = []; // 开始时间

let WorkEndTimeArray = []; // 结束时间
let container = document.getElementById("container");
let container2 = document.getElementById("container2");

let btnStatus = -1; //默认0  0-周六周日除外   1-包含周六周日
let textareaID = document.getElementById("textareaID");

// 监听textarea的输入
textareaID.addEventListener("input", function () {
  let textareaValue = document.querySelector("textarea").value.replace(/}, {/g, "}|{"); //将逗号替换为竖线
  // 如果textareaValue最后有逗号，则删除逗号
  if (textareaValue.slice(-1) == ",") {
    textareaValue = textareaValue.slice(0, -1);
  }
  textareaValue = JSON.parse(textareaValue);
  textareaValue.forEach((item) => {
    // 如果最后一个元素的type为1，则给数组最后再加入一个元素，该元素为之前的最后一个元素，并且把type改为2，时间加上10小时(标准8小时)
    if (item.type == "1" && textareaValue[textareaValue.length - 1].type == "1") {
      textareaValue.push({
        ...textareaValue[textareaValue.length - 1],
        type: "2",
        checktime: formatDateTime(new Date(textareaValue[textareaValue.length - 1].checktime).getTime() + 10 * 60 * 60 * 1000),
      });
    }
  });
  workTime = textareaValue;
  console.log("workTime: ", workTime);
});

/**
 *  转换时间格式
 * @author liujiahui
 * @param {string} textareaTime 时间格式:YYYY-MM-DD HH:mm:ss
 */
function formatDateTime(textareaTime) {
  var date = new Date(textareaTime);
  var y = date.getFullYear();
  var m = date.getMonth() + 1;
  m = m < 10 ? "0" + m : m;
  var d = date.getDate();
  d = d < 10 ? "0" + d : d;
  var h = date.getHours();
  h = h < 10 ? "0" + h : h;
  var minute = date.getMinutes();
  var second = date.getSeconds();
  minute = minute < 10 ? "0" + minute : minute;
  second = second < 10 ? "0" + second : second;
  return y + "-" + m + "-" + d + " " + h + ":" + minute + ":" + second;
}

/**
 *  周末除外的数据
 * @param {nnumber} status 控制按钮状态，0-周末除外   1-单独计算周末
 */
function changeStatus0(status) {
  btnStatus = status;
  WorkStartTimeArray = [];
  WorkEndTimeArray = [];

  workTime.forEach((item) => {
    const time = new Date(item.checktime);
    if (time.getDay() <= 5) {
      item.type === "1" ? WorkStartTimeArray.push(item.checktime) : WorkEndTimeArray.push(item.checktime);
    }
  });
}
/**
 * 单独计算周末工时
 * @param {nnumber} status 控制按钮状态，0-周末除外   1-单独计算周末
 */
function changeStatus1(status) {
  btnStatus = status;
  WorkStartTimeArray = [];
  WorkEndTimeArray = [];
  workTime.forEach((item) => {
    const time = new Date(item.checktime);
    if (time.getDay() > 5) {
      item.type === "1" ? WorkStartTimeArray.push(item.checktime) : WorkEndTimeArray.push(item.checktime);
    }
  });
}
/**
 * 计算工时
 * @param {string} startTime 打卡开始时间
 * @param {string} endTime  打卡结束时间
 * @returns {number} workTime 有效返回工时
 */
function calculateWorkTime(startTime, endTime) {
  let start = new Date(startTime);
  let end = new Date(endTime);

  //迟到
  if (start.getHours() >= 9 && start.getMinutes() >= 1) {
    alert(`${startTime} 星期${start.getDay()}迟到,有打卡异常`);
    // container.innerHTML = `${startTime} 星期${start.getDay()}迟到,有打卡异常`;
  }
  //早退
  if (end.getHours() < 17 || (end.getHours() === 17 && end.getMinutes() < 30)) {
    const alertMsg = `${endTime} 星期${end.getDay()}早退,有打卡异常`;
    alert(alertMsg);
  }

  // 提前打卡或者迟到打卡
  if (start.getHours() !== 8) {
    start = new Date(`${startTime.slice(0, -8)} 08:00:00`);
  }
  if (end.getHours() === 17 && end.getMinutes() > 30) {
    end = new Date(`${startTime.slice(0, -8)} 17:30:00`);
  }
  const timeDiff = end - start;
  let workTime = timeDiff / (1000 * 60 * 60);

  if (btnStatus == 0) {
    if (end.getHours() < 18) {
      workTime -= 1.5;
    } else {
      workTime -= 2; //17:30 到 18:00 半小时，中午1个半小时，总共2小时
    }
    console.log(`有效工时：${workTime.toFixed(4)}  打卡时间：${startTime} - ${endTime}`);
  } else if (btnStatus == 1) {
    workTime -= 1.5;
    let str = `有效工时：${workTime.toFixed(4)}  打卡时间：${startTime} - ${endTime}`;
    weekendArr.push(str);
  }
  return workTime;
}
// 解析数据
function calculateAlltimes() {
  console.log("btnStatus: ", btnStatus);
  if (workTime.length == 0) {
    alert("请先输入数据");
    return;
  }
  if (btnStatus == -1) {
    alert(`请选择"周末除外"或"单独计算周末"`);
    return;
  }
  if (WorkStartTimeArray.length !== WorkEndTimeArray.length) {
    alert(WorkStartTimeArray.length > WorkEndTimeArray.length ? "缺少结束工时" : "缺少开始工时");
    return;
  }

  let workAllTime = 0;
  weekendArr = []; // 把打印的周末数据先清空，防止累加重复打印
  for (let i = 0; i < WorkStartTimeArray.length; i++) {
    const startTime = WorkStartTimeArray[i];
    const endTime = WorkEndTimeArray[i];
    const time = calculateWorkTime(startTime, endTime);
    workAllTime += time;
  }
  if (btnStatus == 0) {
    container2.innerHTML = `本月总工时：${workAllTime.toFixed(2)}, &nbsp;&nbsp;平均工时为:${(workAllTime / WorkStartTimeArray.length).toFixed(2)}`;
  } else if (btnStatus == 1) {
    container2.innerHTML = ``; // 清除上一次解析显示的内容，防止内容重复累加
    // 把文字添加到ID为container2的容器中
    for (let i = 0; i < weekendArr.length; i++) {
      container2.innerHTML += `<p>${weekendArr[i]}</p>`;
    }
  }
}
var searchBox = document.getElementsByClassName("search")[0];
var imgBox = document.getElementsByClassName("img_box")[0];
var closeBox = document.getElementsByClassName("close_search")[0];
searchBox.addEventListener("click", search);
closeBox.addEventListener("click", closeSearch);
// 是否打开查询方法DOM 元素
function search() {
  searchBox.style.display = "none";
  imgBox.style.display = "block";
  closeBox.style.display = "block";
}
// 是否关闭查询方法DOM 元素
function closeSearch() {
  searchBox.style.display = "";
  imgBox.style.display = "none";
  closeBox.style.display = "none";
}
