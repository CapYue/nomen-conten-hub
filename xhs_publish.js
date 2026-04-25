/**
 * 小红书发布脚本 - 本地化版本
 * 自动检测操作系统，使用本地浏览器
 * 支持本地图片上传
 * 
 * Usage: node xhs_publish.js "标题" "正文" "话题" "图片路径"
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const os = require('os');

const title = process.argv[2] || '默认标题';
const content = process.argv[3] || '';
const topics = process.argv[4] || '';
const imagePath = process.argv[5] || '';
const normalizedImagePath = imagePath.replace(/^\/workspace\/nomad-content-hub\//, './');
const SESSION_FILE = './xhs_session.json';

(async () => {
    console.log('Publishing:', title);

    const browser = await chromium.launch({
        channel: 'msedge',
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    });

    const ctx = await browser.newContext({
        storageState: SESSION_FILE,
        viewport: { width: 1280, height: 800 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    });
    const page = await ctx.newPage();
    page.setDefaultTimeout(30000);
    await page.setViewportSize({ width: 1280, height: 800 });

    try {
        const possibleUrls = [
            'https://creator.xiaohongshu.com/publish/publish?type=note',
            'https://creator.xiaohongshu.com/publish/publish?tab=note',
            'https://creator.xiaohongshu.com/publish/note',
            'https://creator.xiaohongshu.com/publish/image',
            'https://creator.xiaohongshu.com/publish/publish'
        ];

        let currentUrl = '';
        for (const url of possibleUrls) {
            console.log(`Trying URL: ${url}`);
            try {
                await page.goto(url, { timeout: 20000, waitUntil: 'networkidle' });
                await page.waitForTimeout(3000);
                currentUrl = page.url();
                console.log(`Loaded URL: ${currentUrl}`);

                if (currentUrl.includes('login')) {
                    console.log('Redirected to login page, trying next URL...');
                    continue;
                }

                const pageTitle = await page.title();
                console.log(`Page title: ${pageTitle}`);

                if (pageTitle.includes('发布') || pageTitle.includes('小红书') || pageTitle.includes('创作者')) {
                    console.log('Appears to be on publish page, proceeding...');
                    break;
                }
            } catch (e) {
                console.log(`Failed to load ${url}:`, e.message);
                continue;
            }
        }

        if (!currentUrl || currentUrl.includes('login')) {
            console.log('Failed to load publish page or redirected to login');
            await browser.close();
            process.exit(1);
        }

        await page.waitForTimeout(2000);
        console.log('Final URL:', currentUrl);

        if (currentUrl.includes('login')) {
            console.log('NOT_LOGGED_IN');
            await browser.close();
            process.exit(1);
        }

        console.log('Ensuring full page visibility...');
        await page.evaluate(() => {
            window.scrollTo(0, 0);
        });
        await page.waitForTimeout(1000);

        await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
        });
        await page.waitForTimeout(2000);

        await page.evaluate(() => {
            window.scrollTo(0, 0);
        });
        await page.waitForTimeout(1000);

        await page.screenshot({ path: './pub_step1.png', fullPage: true });

        console.log('Checking if already in image/text mode...');
        let isAlreadyInImageMode = false;

        const imageUploadSelectors = [
            'button:has-text("上传图片")',
            'button:has-text("添加图片")',
            'button:has-text("选择图片")',
            'text=上传图片',
            'text=添加图片',
            'text=选择图片'
        ];

        for (const selector of imageUploadSelectors) {
            try {
                const btn = await page.locator(selector).first();
                if (await btn.isVisible({ timeout: 2000 })) {
                    console.log(`Found image upload button: ${selector}`);
                    isAlreadyInImageMode = true;
                    break;
                }
            } catch (e) {
                continue;
            }
        }

        if (!isAlreadyInImageMode) {
            const publishButtonSelectors = [
                'button:has-text("发布")',
                'button:has-text("发布笔记")',
                'button:has-text("立即发布")',
                'text=发布',
                'text=发布笔记',
                'text=立即发布'
            ];

            for (const selector of publishButtonSelectors) {
                try {
                    const btn = await page.locator(selector).first();
                    if (await btn.isVisible({ timeout: 2000 })) {
                        console.log(`Found publish button: ${selector}`);
                        isAlreadyInImageMode = true;
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }
        }

        let switchedToImageMode = false;

        if (!isAlreadyInImageMode) {
            console.log('Not in image/text mode, trying to switch...');
            const modeSelectors = [
                'div[role="tab"]:has-text("笔记")',
                'div[role="tab"]:has-text("图文")',
                'button:has-text("笔记")',
                'button:has-text("图文")',
                '.tab-item:has-text("笔记")',
                '.tab-item:has-text("图文")',
                'text=笔记',
                'text=图文'
            ];

            for (const selector of modeSelectors) {
                try {
                    const tab = await page.locator(selector).first();
                    if (await tab.isVisible({ timeout: 2000 })) {
                        console.log(`Found mode selector: ${selector}`);
                        await tab.click();
                        await page.waitForTimeout(5000);

                        let switched = false;
                        for (const imgSelector of imageUploadSelectors) {
                            try {
                                const imgBtn = await page.locator(imgSelector).first();
                                if (await imgBtn.isVisible({ timeout: 2000 })) {
                                    console.log(`Successfully switched to image/text mode (found: ${imgSelector})`);
                                    switched = true;
                                    switchedToImageMode = true;
                                    break;
                                }
                            } catch (e) {
                                continue;
                            }
                        }

                        if (switched) {
                            break;
                        } else {
                            console.log('Clicked tab but still not in image mode, trying next selector...');
                        }
                    }
                } catch (e) {
                    continue;
                }
            }
        } else {
            console.log('Already in image/text mode, skipping switch');
            switchedToImageMode = true;
        }

        if (!switchedToImageMode) {
            console.log('Could not switch to image/text mode, trying alternative approaches...');

            const alternativeParams = [
                '?type=note',
                '?tab=note',
                '?publishType=image',
                '?contentType=note'
            ];

            let foundImageMode = false;
            for (const param of alternativeParams) {
                try {
                    const altUrl = `https://creator.xiaohongshu.com/publish/publish${param}`;
                    console.log(`Trying URL: ${altUrl}`);
                    await page.goto(altUrl, { timeout: 20000, waitUntil: 'networkidle' });
                    await page.waitForTimeout(3000);

                    for (const selector of imageUploadSelectors) {
                        try {
                            const btn = await page.locator(selector).first();
                            if (await btn.isVisible({ timeout: 2000 })) {
                                console.log(`Found image upload button with param ${param}: ${selector}`);
                                foundImageMode = true;
                                break;
                            }
                        } catch (e) {
                            continue;
                        }
                    }

                    if (foundImageMode) {
                        console.log('Successfully loaded image/text mode page');
                        switchedToImageMode = true;
                        break;
                    }
                } catch (e) {
                    console.log(`Failed with param ${param}:`, e.message);
                }
            }

            if (!foundImageMode) {
                console.log('Trying click "上传视频" button and select image/text mode...');
                try {
                    const uploadVideoBtn = await page.locator('button').filter({ hasText: '上传视频' }).first();
                    if (await uploadVideoBtn.isVisible({ timeout: 3000 })) {
                        console.log('Found "上传视频" button, clicking it...');
                        await uploadVideoBtn.click();
                        await page.waitForTimeout(5000);

                        await page.screenshot({ path: './after_click_upload_video.png', fullPage: false });
                        console.log('Screenshot saved: after_click_upload_video.png');

                        const modeOptions = [
                            'text=图文',
                            'text=笔记',
                            'div:has-text("图文")',
                            'div:has-text("笔记")',
                            'button:has-text("图文")',
                            'button:has-text("笔记")'
                        ];

                        for (const option of modeOptions) {
                            try {
                                const modeOption = await page.locator(option).first();
                                if (await modeOption.isVisible({ timeout: 2000 })) {
                                    console.log(`Found mode option: ${option}, clicking...`);
                                    await modeOption.click();
                                    await page.waitForTimeout(3000);

                                    for (const selector of imageUploadSelectors) {
                                        try {
                                            const imgBtn = await page.locator(selector).first();
                                            if (await imgBtn.isVisible({ timeout: 2000 })) {
                                                console.log(`Successfully switched to image/text mode after clicking ${option}`);
                                                foundImageMode = true;
                                                switchedToImageMode = true;
                                                break;
                                            }
                                        } catch (e) {
                                            continue;
                                        }
                                    }

                                    if (foundImageMode) {
                                        break;
                                    }
                                }
                            } catch (e) {
                                continue;
                            }
                        }
                    }
                } catch (e) {
                    console.log('Error with upload video button approach:', e.message);
                }
            }

            if (!switchedToImageMode) {
                console.log('WARNING: Could not switch to image/text mode. Proceeding anyway...');
            }
        }

        console.log('Ensuring input visibility...');
        await page.evaluate(() => {
            window.scrollTo(0, 0);
        });
        await page.waitForTimeout(1000);
        await page.screenshot({ path: './before_filling.png', fullPage: true });
        console.log('Screenshot saved: before_filling.png');

        console.log('Filling title...');
        await page.evaluate(() => {
            const inputs = document.querySelectorAll('input');
            for (const el of inputs) {
                const r = el.getBoundingClientRect();
                if (r.width > 200 && el.type !== 'file') {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    return;
                }
            }
        });
        await page.waitForTimeout(1000);

        await page.evaluate((t) => {
            const inputs = document.querySelectorAll('input');
            for (const el of inputs) {
                const r = el.getBoundingClientRect();
                if (r.width > 200 && el.type !== 'file') {
                    el.focus(); el.value = t; el.dispatchEvent(new Event('input', { bubbles: true })); return;
                }
            }
        }, title);
        await page.waitForTimeout(1000);
        console.log('Title filled');

        console.log('Filling content...');
        await page.evaluate((c) => {
            const els = document.querySelectorAll('[contenteditable="true"], textarea');
            for (const el of els) {
                const r = el.getBoundingClientRect();
                if (r.width > 300) { el.focus(); el.innerHTML = ''; el.innerText = c; el.dispatchEvent(new Event('input', { bubbles: true })); return; }
            }
        }, content);
        await page.waitForTimeout(1000);
        console.log('Content filled');

        if (topics && topics.trim() !== '') {
            console.log('Filling topics:', topics);
            const topicSelectors = [
                'input[placeholder*="话题"]',
                'input[placeholder*="标签"]',
                'input[placeholder*="#"]',
                'textarea[placeholder*="话题"]',
                'textarea[placeholder*="标签"]',
                'textarea[placeholder*="#"]',
                '[contenteditable="true"][placeholder*="话题"]',
                '[contenteditable="true"][placeholder*="标签"]',
                '[contenteditable="true"][placeholder*="#"]'
            ];

            let topicFilled = false;
            for (const selector of topicSelectors) {
                try {
                    const input = await page.locator(selector).first();
                    if (await input.isVisible({ timeout: 2000 })) {
                        await input.fill(topics);
                        await page.waitForTimeout(1000);
                        console.log('Topics filled using selector:', selector);
                        topicFilled = true;
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }

            if (!topicFilled) {
                console.log('No topic input found, appending topics to content');
                await page.evaluate((t) => {
                    const els = document.querySelectorAll('[contenteditable="true"], textarea');
                    for (const el of els) {
                        const r = el.getBoundingClientRect();
                        if (r.width > 300) {
                            el.focus();
                            el.innerText += '\n\n' + t;
                            el.dispatchEvent(new Event('input', { bubbles: true }));
                            return;
                        }
                    }
                }, topics);
                await page.waitForTimeout(1000);
                console.log('Topics appended to content');
            }
        }

        if (normalizedImagePath && fs.existsSync(normalizedImagePath)) {
            console.log('Uploading image:', normalizedImagePath);
            const fileInput = await page.locator('input[type="file"]').first();
            if (await fileInput.isVisible({ timeout: 5000 })) {
                await fileInput.setInputFiles(normalizedImagePath);
                await page.waitForTimeout(3000);
                console.log('Image uploaded');
            } else {
                console.log('File input not found, attempting alternative selector');
                const fileInputs = await page.locator('input[type="file"]').all();
                if (fileInputs.length > 0) {
                    await fileInputs[0].setInputFiles(normalizedImagePath);
                    await page.waitForTimeout(3000);
                    console.log('Image uploaded via alternative');
                }
            }
        } else {
            console.log('No image provided or image file not found');
        }

        await page.screenshot({ path: './pub_step2.png', fullPage: true });

        console.log('Looking for publish button...');
        let publishClicked = false;
        const buttonTexts = ['发布', '发布笔记', '立即发布', '确认发布', '发布内容', '新建图文'];

        for (const text of buttonTexts) {
            try {
                const btn = await page.locator(`text=${text}`).first();
                if (await btn.isVisible({ timeout: 2000 })) {
                    const tagName = await btn.evaluate(el => el.tagName.toLowerCase());
                    const isDisabled = await btn.getAttribute('disabled');
                    const isAriaDisabled = await btn.getAttribute('aria-disabled');
                    const isActuallyDisabled = isDisabled !== null || isAriaDisabled === 'true';

                    if (!isActuallyDisabled) {
                        console.log(`Found publish element with text: "${text}" (tag: ${tagName})`);
                        await btn.scrollIntoViewIfNeeded();
                        await page.waitForTimeout(1000);

                        await btn.click();
                        console.log('Publish element clicked');
                        await page.waitForTimeout(8000);
                        publishClicked = true;
                        break;
                    } else {
                        console.log(`Publish element with text "${text}" is disabled (disabled=${isDisabled}, aria-disabled=${isAriaDisabled})`);
                    }
                }
            } catch (e) {
                continue;
            }
        }

        if (!publishClicked) {
            console.log('Trying button-specific selectors...');
            for (const text of buttonTexts) {
                try {
                    const btn = await page.locator('button').filter({ hasText: text }).first();
                    if (await btn.isVisible({ timeout: 2000 })) {
                        const isDisabled = await btn.getAttribute('disabled');
                        if (!isDisabled) {
                            console.log(`Found publish button with text: "${text}"`);
                            await btn.scrollIntoViewIfNeeded();
                            await page.waitForTimeout(1000);

                            await btn.click();
                            console.log('Publish button clicked');
                            await page.waitForTimeout(8000);
                            publishClicked = true;
                            break;
                        } else {
                            console.log(`Publish button with text "${text}" is disabled`);
                        }
                    }
                } catch (e) {
                    continue;
                }
            }
        }

        if (!publishClicked) {
            console.log('Trying to find and click "新建图文" button...');
            try {
                const newPostBtn = await page.locator('text=新建图文').first();
                if (await newPostBtn.isVisible({ timeout: 3000 })) {
                    console.log('Found "新建图文" button, clicking...');
                    await newPostBtn.scrollIntoViewIfNeeded();
                    await page.waitForTimeout(1000);
                    await newPostBtn.click();
                    await page.waitForTimeout(5000);

                    console.log('Re-trying to find publish button after clicking "新建图文"...');
                    for (const text of ['发布', '发布笔记', '立即发布', '确认发布', '发布内容']) {
                        try {
                            const btn = await page.locator(`text=${text}`).first();
                            if (await btn.isVisible({ timeout: 2000 })) {
                                const tagName = await btn.evaluate(el => el.tagName.toLowerCase());
                                const isDisabled = await btn.getAttribute('disabled');
                                const isAriaDisabled = await btn.getAttribute('aria-disabled');
                                const isActuallyDisabled = isDisabled !== null || isAriaDisabled === 'true';

                                if (!isActuallyDisabled) {
                                    console.log(`Found publish element with text: "${text}" (tag: ${tagName}) after clicking "新建图文"`);
                                    await btn.scrollIntoViewIfNeeded();
                                    await page.waitForTimeout(1000);
                                    await btn.click();
                                    console.log('Publish element clicked after "新建图文"');
                                    await page.waitForTimeout(8000);
                                    publishClicked = true;
                                    break;
                                }
                            }
                        } catch (e) {
                            continue;
                        }
                    }
                }
            } catch (e) {
                console.log('No "新建图文" button found:', e.message);
            }
        }

        if (!publishClicked) {
            console.log('WARNING: No publish button was clicked');
        }

        await page.screenshot({ path: './pub_final.png', fullPage: true });
        const text = await page.evaluate(() => document.body.innerText);
        const success = text.includes('发布成功') || text.includes('已发布') || text.includes('success');
        console.log(success ? 'PUBLISH_SUCCESS' : 'PUBLISH_DONE');

        await browser.close();
        process.exit(0);

    } catch (e) {
        console.error('ERROR:', e.message);
        await page.screenshot({ path: './pub_error.png' }).catch(() => { });
        await browser.close();
        process.exit(1);
    }
})();