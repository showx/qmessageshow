const puppeteer = require('puppeteer');
const fs = require('fs').promises;

async function loginToTencentCloud() {
    try{
        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();
        await page.goto('https://cloud.tencent.com/login');
        console.log('请使用微信扫码登录...');
        // 等待用户扫码登录完成，可能需要调整等待时间或条件
        await page.waitForNavigation();
        console.log('登录成功！');
        // 获取登录后的 cookies
        const cookies = await page.cookies();
        console.log("你的cookie:");
        console.log(cookies);
        console.log(JSON.stringify(cookies));
        await fs.writeFile('cookies.json', JSON.stringify(cookies, null, 2));
        console.log('Cookies 已保存到文件 cookies.json 中。');
        
    }catch(error){
        console.error('An error occurred:', error.message);
    }
    await browser.close();
}

async function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

async function switchAccountAndLogin() {
    const browser = await puppeteer.launch({ headless: false });
    // const page = await browser.newPage();
    // const targets = await browser.targets();
    // const page = await targets[0].page();
    const pages = await browser.pages();
    const page = pages[pages.length - 1]; // 获取最后一个打开的页面

    // 读取保存的cookies
    const cookies = JSON.parse(await fs.readFile('cookies.json', 'utf8'));
    await page.setCookie(...cookies);
    
    // 读取已处理的账号记录
    let processedAccounts = [];
    try {
        processedAccounts = JSON.parse(await fs.readFile('processedAccounts.json', 'utf8'));
    } catch (error) {
        console.log('No processed accounts file found. Starting fresh.');
    }
    await page.goto('https://cloud.tencent.com/login/verify');
    console.log("verify");
    // 获取所有可用的账号，并选择其中一个进行登录
    const accounts = await page.$$('.accsys-checkblock'); // 获取所有账号元素
    if (accounts.length <= 0) {
        console.log('未找到可用账号。');
        await browser.close();
        return;
    }
    // 消息中心的
    page.on('response', async (response) => {
        var url = response.url();
        // console.log(url);
        if (url.includes('DescribeSiteMsg&action=delegate&serviceType=message')) { // 替换为你想捕获的API路径
            apiResponseData = await response.json();
            // var tmp = JSON.stringify(apiResponseData, null, 2);
            await fs.appendFile('message.txt', url + '\n');
            if(apiResponseData.code == 0){
                tmpdata = apiResponseData.data.data.Response.SiteMsgList;
                // console.log(tmpdata);
                for(x=0; x<tmpdata.length; x++){
                    // console.log(tmpdata[x]);
                    const date1 = new Date(tmpdata[x].CreateTime);
                    const date2 = new Date('2024-08-01 0:0:0');
                    console.log(date1,date2);
                    if (date1 >= date2) {
                        var title = tmpdata[x].Title;
                        // 这里能处理自己包含的词
                        if(title.includes('备案')){
                            await fs.appendFile('message.txt', tmpdata[x].Title + " " + tmpdata[x].Category + " " + tmpdata[x].CreateTime + "\n");
                        }else{
                            // console.log('The title does not contain');
                        }
                        
                    }
                }
            }
            // console.log('API 返回结果:', JSON.stringify(apiResponseData, null, 2));
            // await fs.appendFile('result.json', url + '\n');
            // await fs.appendFile('result.json', JSON.stringify(tmp, null, 2) + '\n');
            // console.log('API 返回结果:', apiResponseData);
        }
        
    });

    const uins = await Promise.all(accounts.map(account => 
        account.evaluate(el => el.getAttribute('uin'))
    ));
    
    uins.forEach((uin, index) => {
        console.log(`index: ${index}, uin: ${uin}`);
    });

    for (let index = 0; index < accounts.length; index++) {
        var account = accounts[index];
        console.log("index:",index);
        // 获取每个元素的 uin 属性值
        // var uin = await account.evaluate(el => el.getAttribute('uin'));
        var uin = uins[index];
        console.log(uin);
        // 如果该账号已经处理过，跳过
        if (processedAccounts.includes(uin)) {
            console.log(`账号 ${uin} 已处理过，跳过。`);
            continue;
        }
        console.log("start",uin);
        // 获取元素的文本内容
        // const accountName = await account.evaluate(el => el.innerText);
        // console.log(`index: ${index} uin: ${uin}, 账号名称: ${accountName}`);

        // 点击账号进行登录
        await account.click();
        console.log("account_click",uin);
        // await page.waitForTimeout(5000);
        await delay(2000);
        // break;
        // 点击确定按钮进入
        var nextButton = await page.$('.accsys-tp-btn');
        await nextButton.click();
        console.log("button_click",uin);

        // 将已处理的账号 uin 保存起来
        processedAccounts.push(uin);
        await fs.writeFile('processedAccounts.json', JSON.stringify(processedAccounts, null, 2));
        console.log("write file");

        // 这里不能太快，要delay一下
        await delay(5000);

        // 跳去消息中心
        await page.goto('https://console.cloud.tencent.com/message');
        console.log(uin,"goto 5");
        await delay(5000);
        console.log("goto 5 end")
        // page.reload()
        // 返回验证页面继续处理下一个账号
        // await page.goto('https://cloud.tencent.com/login/verify');
        if(index != (accounts.length-1) ){
            console.log("next",index,accounts.length);
            switchAccountAndLogin();
        }
        break;
    }
    console.log("for end");
    await browser.close();
}
// switchAccountAndLogin();

// loginToTencentCloud();

module.exports = { loginToTencentCloud,switchAccountAndLogin };
