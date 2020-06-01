/**
 * The idea behind "locations" (for lack of a better term)
 * is that we can manage multiple goto points / zones or in the future nogo areas etc.
 *
 * They include the drawing logic (draw function) which is called by the vacuum-map,
 * and can define hooks for user-interaction such as tapping or panning.
 */


const delete_button = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAX6QAAF+kB74ID/gAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAUoSURBVFiFtZfda1pnHMc/zzm+9ag5Ek3VvEASrTEUukpmRqEwt8uNDcbu+l9su9oouQmUjUH/hcFod7mxwgaDQbtBoc1JLkqwpkltS7P40ph0Ok01Jj67SI7VxKjp2PfqnPP8fL7f5+fzexP0iXA4bB8YGHhPCPGxlPJtIcQ44Dlc/ht4CixKKW/VarXbyWRyt599RS+DWCw2LISYE0JcAdx96i0BN4H5paWl7BsJSCQSjlKpdFUI8RmgAdjtdvx+Pz6fD03TsNlsAOzu7rKzs0OhUCCXy7G72zx8Bbjudruv3blzp9q3gJmZmSDwE/AOgMfjIRqN4vV6EaK706SUbG1tkUqlKBaL5ud7iqJ8YhhGrqeAWCz2lqIovwAjVquVCxcuEAgEehJ3EpLNZlleXqZerwP8BXywtLS0fKKAeDweaDQaBjDqdDqJx+O4XK5TER9FpVLBMAzK5TJAZm9vb/bBgwcb5rpqPiQSCUetVvsNmHa5XFy+fJkzZ878J3IAm83GyMgIuVyOer3uVlX1kqZpN7a3t/cBFNOwVCpdBWatVivxeByr1QocuDKfz5+aOJ/PI6UEwGq1Mjs7i9VqRUp5Sdf1r0w7FQ5CTVGUHwBrLBZjcHCwSZ5MJnn48CH7+/sMDQ31Rb66usry8jLVahW/348QApvNhqZpZLNZgJnR0dHvMplMWQEQQswBmsfjIRAINDd68eIFz549AyCdTvPo0aO+yFdXVwFYX19v814wGETXdQBXo9GYA1DD4bDd4XB8D9gvXryI0+ls/sC8gFtbWwBsb2939UQrOUAoFGJiYqL5LoRA0zQ2NjYAIoODg9cVj8fzPjBgs9nwer3HNo1EIkQikeZ7Op0mlUr1RT49PX3MzufzYbfbAXSHw5FQg8Hg50B8ZGSkzf2tMIWZnnj58mWbJ/olN71QLpcplUoIIUoWYMZU1g2RSAQpJWtra01PKIqCEKKNPBwOE41Gu+7l8/lYX19HSjljASaBtv/+JExNTbURmmJMhEKhnuRHuCYVYABoxn0vRCIRzp07d+x7OBw+0e1HYRYxQFe6GZ6ETnXBTDqnhcJB7TYLRk8cvXAm+s0TR7iKCvAEDorGaclDoVBbiK6trXUM0aM4LEwATxRgEaBQKJyafHp6uu880QqTS0q5qEgpbwFdC06vOD+tCJNLVdWflVqtdhso1Wq1jl7oN8n0K2Jzc9Ns2Yo7Ozt/Kofd602AVCrVdpvz+fyxJNMt1I6GaDqdJpd73YVJKVlZWQFACHEjmUzummE4D1SKxaJZLgE4e/Ys4+PjzZP3k2SmpqaanhgbG8Pv9zfXMpmM2Sf+o6rqPBz2A9lstjw8POwA3i0UCgSDQWw2G0IIhoaG0HW9rar1gtfrRdd1JicnmzmjXC6zuLhIo9EAuGYYxq/Q0hG53e5rwL16vc7CwkIzVoUQJxapbjAbETiIe8Mw2NvbA7hbrVa/Nu06NaULwNj/1JQ+t1gss/fv32+GnNpqnMlkysPDw78DH9Xr9YGNjQ00TcPlcr1RW57JZDAMg2q1CvBcCPGhYRhPW+067hqPxwNSyh+llJcAdF0nGo3i8/n6ErK5ucnKykrrYHLXYrF82nryrgLgYBj1eDxfSim/AFzwejTzer04nc620axSqVAoFMjn862jWRn4tlgsfvP48eNaJ56exzm8F3PAFUDvZX+IohDihqqq851OfSoBJs6fP29zOBwJczwHJjgYzyVQBJ5IKRcVRbn16tWrP/odz/8FrN5m2Cy9u4AAAAAASUVORK5CYII=";
const img_delete_button = new Image();
img_delete_button.src = delete_button;

const scale_button = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAWawAAFmsBEvotZwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAASFSURBVEiJtZdNTxtXFIafO5YHXDAGZxJDJg5IbIiUsABXyGqV5he0i9SN1F13laKmIYsu21U2bdNW6Yf6C1q16YdadVepYhVQsR1FApJFlDjYjDs2xjgQbAY8p4tg10ACtpu8O8899zxz7z3nzmtFE4rFYp579+69omna60qpl0UkBJzYGU4rpXIi8reI/D48PHzzxo0b1cNyqoMGx8fHXwIuAVeAo828JJBTSl3zer1fTk9Pl1sGj42NXVBKXQNMgJ6eHvr7+zEMA5/PR0dHBwCVSoVKpUI+n8e2bR49elRLkVFKTcbj8Z+aBatIJPKRiHwIqL6+PkZGRjhy5EhTy11dXeXOnTsUCoXao+uJRGIScA8Ca5FI5DsRuaBpmpw5c0aFw+GmgHu1uLjI3NwcruuilPohHo+/3Qj3NAaPj49fBd7VdZ2JiQkVCoXaggIEAgEMw8C2barV6mnTNL2WZf21Dzw2NvaWUuoLTdOYmJhQjx8/plQqoes6Xq+3LbjP5yMYDLK0tISIvGqa5rxlWQt1cDQa9bmu+wcQGB0dVaFQiFKpxO3bt3nw4AGpVIpKpYJhGCh1YCM8Fd7R0YFt2wqIDg0NfZvJZLY1AMdxLgMngsEgtTM1DKM+2XEcXNdF07S2Vn7y5En6+voAwltbW+8BaLFYzANMApw6dWrfm9b08OFDUqlUW+DG3CJyJRaLeTxdXV1nReRiT08PIyMju4IrlQq9vb2USiUAcrkcuq7T29vbMtjn85HNZnEcp7tYLP7p6e/vf18pFR0cHNzXq4ZhEAqF8Pl85HK5/w3f3NxkZWUFYEUDxmqQvaqdaTgcZnR0tF5Yc3NzbW370aP1W3dcU0odhydbcZCeB7yBcVwDBoBdhfSi4A0MUwOk6ZnPAb4jVwOy8KSCXzS8gWFpgNUquF14uVz/PGc1IAGQz+dbAh8Gd113X/zy8jIAIjLrGRgYKCul3tna2mJoaKhleCAQ2NfnjuNQKBQa2weA+fl5HMfB4/F8oA0PD98Ecmtra7Xmbll7V55KpchkMrtiCoUCa2trAPbs7OyMtmPMPgNYWFhApKUi3wUfHBys/3Ych42NDQBEhLt379aGPmGnqtF1/TqQWV1dJZ1OtwXecRroul5/VjvTdDpNsVgEWPT7/V9Dg/WJRCJvisiPmqYRjUbVzmesLW1sbLC8vIxSiq6uLmZmZnBdV0TkfDKZ/BUaHIhlWQumaeoicta2bYLB4KHX6LPk9XoJBAJUq1Xi8Tjb29sAV5PJ5De1mF2ey7KsKdM0R6rV6umlpSXp7OxUgUCgZbCIkE6nSSaTNej3iUTiEg23pGfvHMuyfjZNExF5zbZtlcvl6O7ubnr1xWKRW7dukUqlkCeV+nEikbjIIfa2rkgkcl5EPgfCAH6/n1AoxLFjx3a5k83NTcrlMvl8nmw2y/r6ei3FoohMJpPJX56W/0Dndu7cuc719fVLInIFaNbr2sCnfr//q6mpqWfew01Zxlgs5rl//34UeAOIAP3896ctA/yjlJoFfovH49Ps2dan6V+1ig10BhpltwAAAABJRU5ErkJggg==";
const img_scale_button = new Image();
img_scale_button.src = scale_button;

const move_button = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAWawAAFmsBEvotZwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAUoSURBVEiJtZdNb1NHFIafuXbMtcVN/Bm7uQRBLKogRZaSuAqhqOUXlEXldt9Vpaqo4Qe0KzZtaSv6of4DFrRIVF2XrEhVf4SgNhApcgJ2brgx/sAJ2Dj2nS4Su3Fim7SFdzczZ85759xzzrwjOARisZhteXn5TUVR3hFCvCGlDALHdpczQogNKeUfUspfwuHw7evXrzde5FP0WpycnHQBF4FLQOAwHwlsCCGu9PX1fTs3N1f518QTExPvCyGuADpAf38/oVAIv9+P0+mkr68PgFqtRrVaJZfLYZom5XK56SIrhJhJJBI/HZZYRKPRz6SUnwLC4/EwOjqKz+drM1peXkZKyalTp9rmS6US9+7dI5/PN6euJpPJGcDaa2fbR6pEo9FrUsqPFEUhEomIsbExXC5Xm9Hz589JJpMUi0V0XW+dHkBVVYaHh1FVlVwuh5RyStf1UcMwbgCyI/Hk5ORl4EOHw8HU1JQIBoOdokQ8Hufp06dYlkW5XGZ4ePiAzcDAAH6/H9M0aTQaY7qu9xmG8dsB4omJifeEEN8oisLU1JTweDwdSZ88ecLS0lJrXKlUGBwcRFXVA7ZOpxOv18va2hpSynO6rv9lGMZii3h6etppWdavwEAkEul6UgCHw4HL5cI0TQAikQiBQAAhOuep0+nkyJEjmKYpgOkTJ078mM1m6wpArVb7BDjm9Xo7hm0vFEXBbre3xna7HUVReu45fvw4uxEc3t7e/hhAicViNmAG4PTp0z0d/B80fUspL8ViMZuyurp6Dgj09/fT7b++DHi9XjRNAwim0+lppdFoXAAIhUKvjLSJPRwXFGACwO/3txmVSiUajRe23K6wLItSqdQ2Fwi0uu6kXQgxBDvZB1CtVrlz5w75fJ5IJNKWSE0Ui8W2D+yU0fV6nYWFBXw+H+Pj46iq2uIAhuzAa7BTJisrKywtLVGv1wFYWFh44cnS6XTP9Xw+z61btwiHw4yMjDSndYXdNial7Lr5ZaDRaGBZrXZt2YF1QKvVapw8eZJQKMT8/DyFQqFnqFdWVgAYGRnB7XYfsKnX69y9exev18v4+DhOp5Nnz541lw07YACvV6tVXC4XTqeTs2fPUiqV0DQNm23/PQJCiBax2+1maGjogI1lWWia1lailUrrel5XgCRALpdr2+h2uzuSHhaKohzoC48fPwZAShlXpJQ3AR49evSfSQ6LJofNZruphMPh28DG5uYmhULhlZHm83k2NzcBzHg8/ruyK8y+AlhcXHwl2S2l5P79+83hF4ClADgcjqtAtlQqkclkejqxLKtV57CTvXvKpCMymUyz6TzUNO172L2Ps9lsXdf1DBDL5XL4/X6xp8u0oVwuE4/HW2PTNAkGgx2FAEChUCCVSiF38MHc3NyfLWIAwzAWdV13SCnfMk0Tr9dLJ3JVVcnn863S8Pl8BwTfXtJEItGM0OVUKvVDc62tXgzDmNV1fbTRaIytra1JVVXFwMDAAYeBQIAHDx5gs9k4c+ZMm9iDnX+ayWRIpVJN0mvJZPIi3cQeIA3D+FnXdaSUb5umKTY2Njh69Gjb6e12O0IIPB4P+2VSsVhkfn6e1dVV5E6mfp5MJj9in7ztKuij0ei7UsqvgWEATdMIBoMMDg62Cfrt7W0qlQq5XI719XW2traaLh5KKWdSqdSNTv57PmHOnz+vbm1tXZRSXgK6K8B2mMCXmqZ9Nzs7W+1m1JO4iVgsZkun09PABSAKhPjn0ZYFHgkh4sDNRCIxx76wdsLfxIAkjAdmYC8AAAAASUVORK5CYII=";
const img_move_button = new Image();
img_move_button.src = move_button;

const marker = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAsCAYAAABygggEAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAWawAAFmsBEvotZwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAATOSURBVFiFtZhNbBtFFMd/s07jjRK7SWrLyYZD20sVWaC2tkgiRJVy4ACUSki98SHgSIUoaikScCq9lAOUSwUHOBUkCioqEuoFFKUFIbS2m0A+aSNHje04AVHsNl4nzj4OsYMbbGfjxv/Tat9/3m/ezHj2yQoHGhwcbMpms4+LyBFN00IiEgAeKobnlFJpETE1Tbuye/fu65cuXVrdLKeqFQwGg226rp8A3gA67xuo1oaKyMZhf4rIh4VC4fzo6Oi9LYPD4fALInIO6AJob28nEAjg9/vRdR1d1wGwLAvLslhcXCSdTnPnzp1SihRwMhKJfOEIfOzYMdfMzMxZ4DSAz+ejt7eXnTt3Vpvjfcpms0xOTpJOp9cASn0qIscjkchKVXBxLy8Dz7hcLtm/f7/q7u52BNyoZDLJyMgIq6urKKW+a2tre25oaKhQirvKzZ2dneeVUs/rus7AwIDy+Xx1QQE8Hg+BQIB0Ok2hUNi3vLzcnkqlrv4PHA6HXwHONjU1SX9/v/J6vXVDS3K73fh8Pubm5kRE+g3DiKdSqZF1cF9fn9e27StA64EDBx6o0krwtrY2lUqlAAb27t37ye3bt5c1gJWVlbcAv9/vp949raXu7m6KxQQsyzoFoILBYLOu62mg/dChQ2zHEldSJpNheHgY4G8goLnd7sNAe0dHR8OgAF6vt/ST7FBKDWpKqaMAgUCgYdCSurq6So9HNeBhgF27djUcXDq0IvKIBvQAtLS0NBxcxjA0inex2+1uOLiM0a0BFsDq6qZfsgdWGcPSgCRAPp9vOLiMkVgHLy0tNRxcxkhqwDVg/TPWSJUYIjKsKaUul15W6Ca2TSLC/Px86flbzTTN34HJXC5HMplsGDiRSGBZFsB4LBYb14ozeB9gamoK27a3HWrbNlNTUwAopc4AaADRaPRLILu0tMT4+Pi2g8fGxsjlciilsqZpfrUOXpuU/bJSing8Tjwe3zZoPB5ndnYWABF5FbChrAOZn5+fMAwjBOxbWFgAoLOzc72N3apEhJmZGSYmJgBQSn0fiUTeKcWbys35fP6l5ubmWcAzPT3N3bt3CQaDW75OLctibGyMYteBiNxzuVwvlnvua/YWFhYswzAWgWdhrVWdnZ3Ftm1aW1vZsWNHTWAul+PWrVvEYjEymUx56LhpmtfLX1RaRy0UCv0M9G0MeL1e/H4/LS0t66uQz+fJ5XIsLi5uhJUUiUQij1Lc25KaKhhtEXlNKfUr/x0+YK19qZK8mmwROb4RysbEJUWj0Qjw2VYIVfR5NBr9pVKgIhjA5XK9Dfz1ANCMpmnvVs1fLZBIJHI9PT1LwFN1gk+ZpvljtWDVigH27NlzARipAzrq8Xgu1DJsejuEw+HHROSaE+96UqUOm6Y5VMtTs2IA0zR/UkpddAoFLm4GdQQGcLlcJ4F/HFizhULhtKOcTkyJROKeYRgF4MlaPhF578aNG1dreUpyVDGAx+P5CPithuWPTCbzsdN8jsFDQ0MF27ZPVIuLyOs3b9503Ko6BgPEYrEfgK8rQL+JRqOOlrguMICmaW8C5X8j5WzbPrnVPI4OV7mSyWTGMAwNeKL46kwsFruy1TxbrhjAsqxzwDQw4/F4PqgnR90KhUJPHzx48Ei94/8Fqg71Bf5YlvUAAAAASUVORK5CYII=";
const img_marker = new Image();
img_marker.src = marker;

const marker_active = "data:image/png;base64,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";
const img_marker_active = new Image();
img_marker_active.src = marker_active;

/**
 * Represents a point the robot can be sent to.
 */
export class GotoPoint  {

    constructor(x ,y) {
        this.x = x;
        this.y = y;
    }

    draw(ctx, transformFromMapSpace) {
        const p1 = new DOMPoint(this.x, this.y).matrixTransform(transformFromMapSpace);

        ctx.drawImage(
            img_marker,
            p1.x - img_marker.width / 2,
            p1.y - img_marker.height
        );
    }

    toZone(x2, y2) {
        return new Zone(this.x, this.y, x2, y2);
    }
}

/**
 * Represents a zone for zoned_cleanup.
 */
export class Zone {

    constructor(x1 ,y1, x2, y2) {
        this.buttonSize = 30;

        this.active = true;
        this.isResizing = false;

        this.x1 = Math.min(x1, x2);
        this.x2 = Math.max(x1, x2);

        this.y1 = Math.min(y1, y2);
        this.y2 = Math.max(y1, y2);
    }

    draw(ctx, transformMapToScreenSpace) {
        const p1 = new DOMPoint(this.x1, this.y1).matrixTransform(transformMapToScreenSpace);
        const p2 = new DOMPoint(this.x2, this.y2).matrixTransform(transformMapToScreenSpace);

        ctx.save();
        if (!this.active) {
            ctx.strokeStyle = "rgb(255, 255, 255)";
            ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        } else {
            ctx.setLineDash([15, 5]);
            ctx.strokeStyle = "rgb(255, 255, 255)";
            ctx.fillStyle = "rgba(255, 255, 255, 0)";
        }

        ctx.lineWidth = 2;
        ctx.fillRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
        ctx.strokeRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
        ctx.restore();

        if (this.active) {
            ctx.drawImage(
                img_delete_button,
                p2.x - img_delete_button.width / 2,
                p1.y - img_delete_button.height / 2
            );

            ctx.drawImage(
                img_scale_button,
                p2.x - img_scale_button.width / 2,
                p2.y - img_scale_button.height / 2
            );
        }
    }

    /**
     * Handler for intercepting tap events on the canvas
     * Used for activating / deleting the zone
     *
     * @param {{x: number, y: number}} tappedPoint - The tapped point in screen coordinates
     * @param {DOMMatrix} transformMapToScreenSpace - The transformation for transforming map-space coordinates into screen-space.
     * This is the transform applied by the vacuum-map canvas.
     */
    tap(tappedPoint, transformMapToScreenSpace) {
        const p1 = new DOMPoint(this.x1, this.y1).matrixTransform(transformMapToScreenSpace);
        const p2 = new DOMPoint(this.x2, this.y2).matrixTransform(transformMapToScreenSpace);

        const distanceFromDelete = Math.sqrt(
            Math.pow(tappedPoint.x - p2.x, 2) + Math.pow(tappedPoint.y - p1.y, 2)
        );

        if (this.active && distanceFromDelete <= this.buttonSize / 2) {
            return {
                updatedLocation: null,
                stopPropagation: true
            };
        } else if (
            tappedPoint.x >= p1.x
            && tappedPoint.x <= p2.x
            && tappedPoint.y >= p1.y
            && tappedPoint.y <= p2.y
        ) {
            this.active = true;

            return {
                updatedLocation: this,
                stopPropagation: false
            };
        } else {
            this.active = false;
        }

        return {
            updatedLocation: this,
            stopPropagation: false
        };
    }

    /**
     * Handler for intercepting pan events on the canvas
     * Used for resizing / moving the zone
     *
     * @param {{x: number, y: number}} start - The coordinates where the panning started
     * @param {{x: number, y: number}} last - The coordinates from the last call
     * @param {{x: number, y: number}} current - The current coordinates of the pointer
     * @param {DOMMatrix} transformMapToScreenSpace - The transformation for transforming map-space coordinates into screen-space.
     * This is the transform applied by the vacuum-map canvas.
     */
    translate(start, last, current, transformMapToScreenSpace) {
        if (this.active) {
            const transformCanvasToMapSpace = transformMapToScreenSpace.inverse();
            const p1 = new DOMPoint(this.x1, this.y1).matrixTransform(transformMapToScreenSpace);
            const p2 = new DOMPoint(this.x2, this.y2).matrixTransform(transformMapToScreenSpace);

            const distanceFromResize = Math.sqrt(
                Math.pow(last.x - p2.x, 2) + Math.pow(last.y - p2.y, 2)
            );
            if (!this.isResizing && distanceFromResize <= this.buttonSize / 2) {
                this.isResizing = true;
            }

            const lastInMapSpace = new  DOMPoint(last.x, last.y).matrixTransform(transformCanvasToMapSpace);
            const currentInMapSpace = new  DOMPoint(current.x, current.y).matrixTransform(transformCanvasToMapSpace);

            const dx = currentInMapSpace.x - lastInMapSpace.x;
            const dy = currentInMapSpace.y - lastInMapSpace.y;

            if (this.isResizing) {
                if (currentInMapSpace.x > this.x1 + 5 && this.x2 + dx > this.x1 + 5) {
                    this.x2 += dx;
                }
                if (currentInMapSpace.y > this.y1 + 5 && this.y2 + dy > this.y1 + 5) {
                    this.y2 += dy;
                }

                return {
                    updatedLocation: this,
                    stopPropagation: true
                };
            } else if (
                last.x >= p1.x
                && last.x <= p2.x
                && last.y >= p1.y
                && last.y <= p2.y
            ) {
                this.x1 += dx;
                this.y1 += dy;
                this.x2 += dx;
                this.y2 += dy;

                return {
                    updatedLocation: this,
                    stopPropagation: true
                };
            } else {
                this.active = false;
            }
        }

        return {
            updatedLocation: this,
            stopPropagation: false
        };
    }
}

/**
 * Current goto target point
 */
export class GotoTarget  {

    constructor(x ,y) {
        this.x = x;
        this.y = y;
    }

    draw(ctx, transformFromMapSpace) {
        const p1 = new DOMPoint(this.x, this.y).matrixTransform(transformFromMapSpace);


        ctx.drawImage(
            img_marker_active,
            p1.x - img_marker_active.width / 2,
            p1.y - img_marker_active.height / 2
        );
    }
}

/**
 * Represents the currently cleaned zone
 */
export class CurrentCleaningZone  {

    /**
     * @param {DOMPoint} p1
     * @param {DOMPoint} p2
     */
    constructor(p1, p2) {
        this.p1 = p1;
        this.p2 = p2;
    }

    draw(ctx, transformFromMapSpace) {
        const p1Screen = this.p1.matrixTransform(transformFromMapSpace);
        const p2Screen = this.p2.matrixTransform(transformFromMapSpace);

        ctx.strokeStyle = "rgb(53, 145, 26)";
        ctx.fillStyle = "rgba(107, 244, 66, 0.3)";

        ctx.lineWidth = 2;
        ctx.fillRect(p1Screen.x, p1Screen.y, p2Screen.x - p1Screen.x, p2Screen.y - p1Screen.y);
        ctx.strokeRect(p1Screen.x, p1Screen.y, p2Screen.x - p1Screen.x, p2Screen.y - p1Screen.y);
    }
}

/**
 * Represents a virtual wall the robot does not pass
 */
export class VirtualWall  {

    constructor(x1 ,y1, x2, y2, editable) {
        this.editable = editable || false;

        if (editable) {
            this.active = true;
            this.buttonSize = 30;
        } else {
            this.active = false;
        }

        this.x1 = x1;
        this.x2 = x2;

        this.y1 = y1;
        this.y2 = y2;
    }

    draw(ctx, transformFromMapSpace) {
        const p1 = new DOMPoint(this.x1, this.y1).matrixTransform(transformFromMapSpace);
        const p2 = new DOMPoint(this.x2, this.y2).matrixTransform(transformFromMapSpace);

        ctx.save();
        ctx.beginPath();
        ctx.lineWidth = 5;
        ctx.lineCap = "round";
        ctx.strokeStyle = "red";
        if (this.editable && this.active) {
            ctx.setLineDash([8, 6]);
        }
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = "red";
        ctx.stroke();

        ctx.restore();

        if (this.active) {
            ctx.drawImage(
                img_delete_button,
                p1.x - img_delete_button.width / 2,
                p1.y - img_delete_button.height / 2
            );

            ctx.drawImage(
                img_move_button,
                p2.x - img_move_button.width / 2,
                p2.y - img_move_button.height / 2
            );
        }
        if (this.editable) {
            this.matrix = new DOMMatrix().rotateFromVectorSelf(p2.y - p1.y,p2.x - p1.x);
            this.sp1 = p1.matrixTransform(new DOMMatrix().translate(-10).rotateFromVectorSelf(p2.y - p1.y,p2.x - p1.x));
            this.sp2 = p2.matrixTransform(new DOMMatrix().translate(+10).rotateFromVectorSelf(p2.y - p1.y,p2.x - p1.x));
        }
    }
    /**
     * Handler for intercepting tap events on the canvas
     * Used for activating / deleting the wall
     *
     * @param {{x: number, y: number}} tappedPoint - The tapped point in screen coordinates
     * @param {DOMMatrix} transformMapToScreenSpace - The transformation for transforming map-space coordinates into screen-space.
     * This is the transform applied by the vacuum-map canvas.
     */
    tap(tappedPoint, transformMapToScreenSpace) {
        if (!this.editable) {
            return {
                updatedLocation: this,
                stopPropagation: false
            };
        }

        const p1 = new DOMPoint(this.x1, this.y1).matrixTransform(transformMapToScreenSpace);
        // eslint-disable-next-line no-unused-vars
        const p2 = new DOMPoint(this.x2, this.y2).matrixTransform(transformMapToScreenSpace);

        const distanceFromDelete = Math.sqrt(
            Math.pow(tappedPoint.x - p1.x, 2) + Math.pow(tappedPoint.y - p1.y, 2)
        );

        const sTappedPoint = new DOMPoint(tappedPoint.x,tappedPoint.y).matrixTransform(this.matrix);

        if (this.active && distanceFromDelete <= this.buttonSize / 2) {
            return {
                updatedLocation: null,
                stopPropagation: true
            };
        } else if (
            sTappedPoint.x >= this.sp1.x
            && sTappedPoint.x <= this.sp2.x
            && sTappedPoint.y >= this.sp1.y
            && sTappedPoint.y <= this.sp2.y
        ) {
            this.active = true;

            return {
                updatedLocation: this,
                stopPropagation: false
            };
        } else {
            this.active = false;
        }

        return {
            updatedLocation: this,
            stopPropagation: false
        };
    }

    /**
     * Handler for intercepting pan events on the canvas
     * Used for resizing / moving the zone
     *
     * @param {{x: number, y: number}} start - The coordinates where the panning started
     * @param {{x: number, y: number}} last - The coordinates from the last call
     * @param {{x: number, y: number}} current - The current coordinates of the pointer
     * @param {DOMMatrix} transformMapToScreenSpace - The transformation for transforming map-space coordinates into screen-space.
     * This is the transform applied by the vacuum-map canvas.
     */
    translate(start, last, current, transformMapToScreenSpace) {
        if (this.active) {
            const transformCanvasToMapSpace = transformMapToScreenSpace.inverse();
            // eslint-disable-next-line no-unused-vars
            const p1 = new DOMPoint(this.x1, this.y1).matrixTransform(transformMapToScreenSpace);
            const p2 = new DOMPoint(this.x2, this.y2).matrixTransform(transformMapToScreenSpace);

            const distanceFromResize = Math.sqrt(
                Math.pow(last.x - p2.x, 2) + Math.pow(last.y - p2.y, 2)
            );

            const lastInMapSpace = new  DOMPoint(last.x, last.y).matrixTransform(transformCanvasToMapSpace);
            const currentInMapSpace = new  DOMPoint(current.x, current.y).matrixTransform(transformCanvasToMapSpace);

            const dx = currentInMapSpace.x - lastInMapSpace.x;
            const dy = currentInMapSpace.y - lastInMapSpace.y;

            const sLast = new DOMPoint(last.x,last.y).matrixTransform(this.matrix);

            if (distanceFromResize <= this.buttonSize / 2) {
                this.x2 += dx;
                this.y2 += dy;

                return {
                    updatedLocation: this,
                    stopPropagation: true
                };
            } else if (
                sLast.x >= this.sp1.x
                && sLast.x <= this.sp2.x
                && sLast.y >= this.sp1.y
                && sLast.y <= this.sp2.y
            ) {
                this.x1 += dx;
                this.y1 += dy;
                this.x2 += dx;
                this.y2 += dy;

                return {
                    updatedLocation: this,
                    stopPropagation: true
                };
            }
        }

        return {
            updatedLocation: this,
            stopPropagation: false
        };
    }
}

/**
 * Represents a nogo zone the robot does not enter
 */
export class ForbiddenZone  {

    constructor(x1, y1, x2, y2, x3, y3, x4, y4, editable) {
        this.editable = editable || false;

        if (editable) {
            this.active = true;
            this.isResizing = false;
            this.buttonSize = 30;
        } else {
            this.active = false;
        }

        this.x1 = x1;
        this.x2 = x2;
        this.x3 = x3;
        this.x4 = x4;

        this.y1 = y1;
        this.y2 = y2;
        this.y3 = y3;
        this.y4 = y4;
    }

    draw(ctx, transformMapToScreenSpace) {
        const p1 = new DOMPoint(this.x1, this.y1).matrixTransform(transformMapToScreenSpace);
        const p2 = new DOMPoint(this.x2, this.y2).matrixTransform(transformMapToScreenSpace);
        const p3 = new DOMPoint(this.x3, this.y3).matrixTransform(transformMapToScreenSpace);
        const p4 = new DOMPoint(this.x4, this.y4).matrixTransform(transformMapToScreenSpace);

        ctx.save();
        if (!this.active) {
            ctx.strokeStyle = "rgb(255, 0, 0)";
            ctx.fillStyle = "rgba(255, 0, 0, 0.4)";
        } else {
            ctx.setLineDash([8, 6]);
            ctx.strokeStyle = "rgb(255, 0, 0)";
            ctx.fillStyle = "rgba(255, 0, 0, 0)";
        }

        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        if (this.active) {
            ctx.drawImage(
                img_delete_button,
                p2.x - img_delete_button.width / 2,
                p2.y - img_delete_button.height / 2
            );

            ctx.drawImage(
                img_scale_button,
                p3.x - img_scale_button.width / 2,
                p3.y - img_scale_button.height / 2
            );
        }
    }

    /**
     * Handler for intercepting tap events on the canvas
     * Used for activating / deleting the zone
     *
     * @param {{x: number, y: number}} tappedPoint - The tapped point in screen coordinates
     * @param {DOMMatrix} transformMapToScreenSpace - The transformation for transforming map-space coordinates into screen-space.
     * This is the transform applied by the vacuum-map canvas.
     */
    tap(tappedPoint, transformMapToScreenSpace) {
        if (!this.editable) {
            return {
                updatedLocation: this,
                stopPropagation: false
            };
        }

        const p1 = new DOMPoint(this.x1, this.y1).matrixTransform(transformMapToScreenSpace);
        const p2 = new DOMPoint(this.x2, this.y2).matrixTransform(transformMapToScreenSpace);
        const p3 = new DOMPoint(this.x3, this.y3).matrixTransform(transformMapToScreenSpace);
        // eslint-disable-next-line no-unused-vars
        const p4 = new DOMPoint(this.x4, this.y4).matrixTransform(transformMapToScreenSpace);

        const distanceFromDelete = Math.sqrt(
            Math.pow(tappedPoint.x - p2.x, 2) + Math.pow(tappedPoint.y - p2.y, 2)
        );

        if (this.active && distanceFromDelete <= this.buttonSize / 2) {
            return {
                updatedLocation: null,
                stopPropagation: true
            };
        } else if (
            tappedPoint.x >= p1.x
            && tappedPoint.x <= p3.x
            && tappedPoint.y >= p1.y
            && tappedPoint.y <= p3.y
        ) {
            this.active = true;

            return {
                updatedLocation: this,
                stopPropagation: false
            };
        } else {
            this.active = false;
        }

        return {
            updatedLocation: this,
            stopPropagation: false
        };
    }

    /**
     * Handler for intercepting pan events on the canvas
     * Used for resizing / moving the zone
     *
     * @param {{x: number, y: number}} start - The coordinates where the panning started
     * @param {{x: number, y: number}} last - The coordinates from the last call
     * @param {{x: number, y: number}} current - The current coordinates of the pointer
     * @param {DOMMatrix} transformMapToScreenSpace - The transformation for transforming map-space coordinates into screen-space.
     * This is the transform applied by the vacuum-map canvas.
     */
    translate(start, last, current, transformMapToScreenSpace) {
        if (this.active) {
            const transformCanvasToMapSpace = transformMapToScreenSpace.inverse();
            const p1 = new DOMPoint(this.x1, this.y1).matrixTransform(transformMapToScreenSpace);
            // eslint-disable-next-line no-unused-vars
            const p2 = new DOMPoint(this.x2, this.y2).matrixTransform(transformMapToScreenSpace);
            const p3 = new DOMPoint(this.x3, this.y3).matrixTransform(transformMapToScreenSpace);
            // eslint-disable-next-line no-unused-vars
            const p4 = new DOMPoint(this.x4, this.y4).matrixTransform(transformMapToScreenSpace);

            const distanceFromResize = Math.sqrt(
                Math.pow(last.x - p3.x, 2) + Math.pow(last.y - p3.y, 2)
            );
            if (!this.isResizing && distanceFromResize <= this.buttonSize / 2) {
                this.isResizing = true;
            }

            const lastInMapSpace = new  DOMPoint(last.x, last.y).matrixTransform(transformCanvasToMapSpace);
            const currentInMapSpace = new  DOMPoint(current.x, current.y).matrixTransform(transformCanvasToMapSpace);

            const dx = currentInMapSpace.x - lastInMapSpace.x;
            const dy = currentInMapSpace.y - lastInMapSpace.y;

            if (this.isResizing) {
                if (currentInMapSpace.x > this.x1 + 5 && this.x2 + dx > this.x1 + 5) {
                    this.x2 += dx;
                    this.x3 += dx;
                }
                if (currentInMapSpace.y > this.y1 + 5 && this.y3 + dy > this.y1 + 5) {
                    this.y3 += dy;
                    this.y4 += dy;
                }

                return {
                    updatedLocation: this,
                    stopPropagation: true
                };
            } else if (
                last.x >= p1.x
                && last.x <= p3.x
                && last.y >= p1.y
                && last.y <= p3.y
            ) {
                this.x1 += dx;
                this.y1 += dy;
                this.x2 += dx;
                this.y2 += dy;
                this.x3 += dx;
                this.y3 += dy;
                this.x4 += dx;
                this.y4 += dy;

                return {
                    updatedLocation: this,
                    stopPropagation: true
                };
            }
        }

        return {
            updatedLocation: this,
            stopPropagation: false
        };
    }

}

/**
 * Label of a segment
 */
export class SegmentLabel  {

    constructor(x ,y, label) {
        this.x = x;
        this.y = y;
        this.label = label;
    }

    draw(ctx, transformFromMapSpace) {
        const p1 = new DOMPoint(this.x, this.y).matrixTransform(transformFromMapSpace);
        const oldAlpha = ctx.globalAlpha;

        ctx.globalAlpha = 0.7;
        ctx.textAlign = "center";
        ctx.font = "30px sans-serif";
        ctx.fillText(this.label, p1.x, p1.y);

        ctx.globalAlpha = oldAlpha;
    }
}