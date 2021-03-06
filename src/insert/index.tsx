/* eslint-disable max-len */
import React from 'react';
import ReactDOM from 'react-dom';

import './index.scss';

export {};

const {base64encode, getCookie} = require('./baiduId');

// eslint-disable-next-line camelcase
const getDirectLink = (selects: number[], vcode?: string, code?: string, success?: (list: {dlink: string, server_filename: string}[]) => void, fail?: (imgUrl: string, vcode: string) => void) => {
  const data = JSON.parse(document.getElementById('direct_download_id')?.getAttribute('yun-data')!);
  const _selects: number[] = selects.slice();
  if (selects.length === 0) {
    _selects.push(0);
  }

  const list: number[] = [];
  _selects.map((item) => {
    list.push(data.file_list.list[item].fs_id);
  });
  const getDownloadUrl = `https://pan.baidu.com/api/sharedownload?sign=${data.sign}&timestamp=${data.timestamp}&channel=chunlei&web=1&app_id=${data.file_list.list[0].app_id}&bdstoken=${data.bdstoken}&logid=${base64encode(getCookie('BAIDUID') as string)}&clienttype=0`;

  const formData = new FormData();
  formData.append('encrypt', data.expired_type.toString());
  formData.append('extra', JSON.stringify({'sekey': decodeURIComponent(getCookie('BDCLND') as string)}));
  formData.append('product', 'share');
  formData.append('uk', data.uk.toString());
  formData.append('primaryid', data.shareid.toString());
  formData.append('fid_list', `[${list}]`);
  formData.append('path_list', '');
  formData.append('vip', data.is_vip.toString());
  if (vcode) {
    formData.append('vcode_str', vcode);
  }
  if (code) {
    formData.append('vcode_input', code);
  }

  const xhr = new XMLHttpRequest();
  xhr.open('POST', getDownloadUrl);
  xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
  xhr.setRequestHeader('Accept', 'application/json, text/javascript, */*; q=0.01');
  xhr.onload = () => {
    const response = JSON.parse(xhr.response);
    if (response.errno === -20) {
      getVCode((imgUrl, vcode) => {
        if (!document.getElementById('__custom_vcode_dialog')) {
          const dialog = document.createElement('div');
          document.getElementById('layoutApp')?.appendChild(dialog);

          ReactDOM.render(<VCodeDialog select={selects} show imgUrl={imgUrl} vcode={vcode} />, dialog);
        } else {
          fail && fail(imgUrl, vcode);
        }
      });
    } else {
      success && success(response.list);
    }
  };
  xhr.send(formData);
};

const getVCode = (cb: (imgUrl: string, vcode: string) => void) => {
  const data = JSON.parse(document.getElementById('direct_download_id')?.getAttribute('yun-data')!);

  const codeXhr = new XMLHttpRequest();
  const codeUrl = `https://pan.baidu.com/api/getvcode?prod=pan&t=${Math.random()}&channel=chunlei&web=1&app_id=${data.app_id}&bdstoken=${data.bdstoken}&logid=${base64encode(getCookie('BAIDUID') as string)}&clienttype=0`;
  codeXhr.open('GET', codeUrl);
  codeXhr.onload = () => {
    const response = JSON.parse(codeXhr.response);
    cb(response.img, response.vcode);
  };
  codeXhr.send();
};

function DLinkButton() {
  return <span className='g-button-right' id='direct_download_id'>
    <span className='text'>
        获取直链
    </span>
  </span>;
}

interface VCDProps {
  imgUrl: string
  select: number[]
  vcode: string
  show: boolean
}

function VCodeDialog(props: VCDProps) {
  const [imgUrl, setImageUrl] = React.useState('');
  const [show, setShow] = React.useState(false);
  const [vcode, setVCode] = React.useState('');
  const [code, setCode] = React.useState('');

  React.useEffect(() => {
    setImageUrl(props.imgUrl);
    setShow(props.show);
    setVCode(props.vcode);
  }, [props]);

  return show ? <div id='__custom_vcode_dialog' style={{'width': '100%', 'height': '100vh', 'background': 'rgba(0, 0, 0, 0.5)', 'zIndex': 100, 'position': 'fixed', 'top': '0', 'display': 'flex', 'alignItems': 'center', 'justifyContent': 'center'}}>
    <div className='dialog dialog-dialog1 dialog-gray' id='dialog1' style={{'width': '520px', 'display': 'block', 'visibility': 'visible', 'zIndex': 52}}>
      <div className='dialog-header dialog-drag'>
        <h3>
          <span className='dialog-header-title'>
            <em className='select-text'>提示</em>
          </span>
        </h3>
        <div className='dialog-control'>
          <span className='dialog-icon dialog-close icon icon-close' onClick={() => {
            setShow(false);
          }}>
            <span className='sicon'>×</span>
          </span>
        </div>
      </div>
      <div className='dialog-body'>
        <div style={{'textAlign': 'center', 'padding': '22px'}}>
          <div className='download-verify' style={{'marginTop': '10px', 'padding': '0 28px', 'textAlign': 'left', 'fontSize': '12px'}} id='downloadVerify'>
            <div className='verify-body'>请输入验证码：<input type='text' style={{'padding': '3px', 'width': '85px', 'height': '23px', 'border': '1px solid #C6C6C6', 'backgroundColor': 'white', 'verticalAlign': 'middle'}} className='input-code' maxLength={4} onChange={(e) => {
              setCode(e.currentTarget.value);
            }} />
            <img className='img-code' style={{'marginLeft': '10px', 'verticalAlign': 'middle'}} alt='点击换一张' src={imgUrl} width='100' height='30' />
            <a href='javascript:;' style={{'textDecoration': 'underline'}} className='underline' onClick={() => {
              getVCode((_imgUrl, vcode) => {
                setImageUrl(_imgUrl);
                setVCode(vcode);
              });
            }}>换一张</a>
            </div>
            <div style={{'paddingLeft': '84px', 'height': '18px', 'color': '#d80000'}} className='verify-error'></div>
          </div>
        </div>
      </div>
      <div className='dialog-footer g-clearfix'>
        <a className='g-button g-button-blue' data-button-id='b13' data-button-index='' href='javascript:;' title='确定' node-type='confirm' style={{'paddingLeft': '36px'}} onClick={() => {
          getDirectLink(props.select, vcode, code, (list) => {
            setShow(false);
            // 处理直链的真实地址
            chrome.runtime.sendMessage(chrome.runtime.id, list, {}, () => {});
          }, (_imgUrl, _vcode) => {
            setImageUrl(_imgUrl);
            setVCode(_vcode);
          });
        }}>
          <span className='g-button-right' style={{'paddingRight': '36px'}}>
            <span className='text' style={{'width': 'auto'}}>确定</span>
          </span>
        </a>
        <a className='g-button' data-button-id='b15' data-button-index='' href='javascript:;' title='取消' node-type='cancel' style={{'paddingLeft': '36px'}} onClick={() => {
          setShow(false);
        }}>
          <span className='g-button-right' style={{'paddingRight': '36px'}}>
            <span className='text' style={{'width': 'auto'}}>取消</span>
          </span>
        </a>
      </div>
    </div>
  </div> : null;
}

interface TDProps {
  show: boolean
  // eslint-disable-next-line camelcase
  list: {dlink: string, server_filename: string}[]
}

function ThunderDownload(props: TDProps) {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    setShow(props.show);
  }, [props]);

  const downloadCell = (fileName: string, dlink: string, index: number) =>
    <div className='__dialog-cell'>
      <div className='__dialog-cell-file_name'>{fileName}</div>
      <a className='__dialog-cell-a' href={`thunder://${base64encode(`AA${dlink}ZZ`)}`} onClick={() => {
      }}>迅雷下载</a>
      <a className='__dialog-cell-a' href='javascript:;' onClick={() => {
        const range = document.createRange();
        range.selectNodeContents(document.querySelector(`#__custom_address_str_${index}`)!);
        const selection = document.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
        document.execCommand('Copy');
      }}>复制地址</a>
      <div id={`__custom_address_str_${index}`} style={{'position': 'absolute', 'opacity': 0, 'zIndex': -1}}>{dlink}</div>
    </div>;

  return show ? <div id='__custom_thunder_dialog' style={{'width': '100%', 'height': '100vh', 'background': 'rgba(0, 0, 0, 0.5)', 'zIndex': 100, 'position': 'fixed', 'top': '0', 'display': 'flex', 'alignItems': 'center', 'justifyContent': 'center'}}>
    <div className='__dialog'>
      <div className='__dialog-header'>
        <div style={{'fontSize': '18px'}}>请选择下载</div>
        <button className='__dialog-header-close' onClick={() => {
          setShow(false);
        }} >×</button>
      </div>
      {props.list.map((item, index) => downloadCell(item.server_filename, item.dlink, index))}
    </div>
  </div> : null
  ;
}

const button = document.createElement('a');
// eslint-disable-next-line no-script-url
button.href = 'javascript:;';
button.className = 'g-button';
button.style.background = 'white';
button.id = 'custom-download-button';

const onClick = () => {
  const ddArray: HTMLCollectionOf<Element> =
  document.getElementsByClassName(
      'g-clearfix AuPKyz open-enable JS-item-active',
  );
  const selects: number[] = [];
  for (let index = 0; index < ddArray.length; index ++) {
    const dd = ddArray.item(index);
    selects.push(parseInt(dd!.attributes!.getNamedItem('_position')!.value));
  }

  getDirectLink(selects, undefined, undefined, (list) => {
    chrome.runtime.sendMessage(chrome.runtime.id, list, {}, () => {});
  });
};

button.onclick = onClick;
document.getElementsByClassName('x-button-box')[0].appendChild(button);
ReactDOM.render(<DLinkButton />, button);


chrome.runtime.onMessage.addListener((e) => {
  const div = document.createElement('div');
  document.getElementById('layoutApp')?.appendChild(div);
  ReactDOM.render(<ThunderDownload list={e} show />, div);

  return true;
});
