const DB = {
    grades:  [20, 25, 30, 35, 40, 45, 50, 60],
    cement:  [250, 300, 350, 375, 400, 425, 450, 500],
    wcr:     [0.45,0.40,0.38,0.36,0.32,0.31,0.30,0.28],
    highChem:[2,   2.5, 3,   4,   6.5, 7,   7.5, 8]
};

function num(v){ const x=parseFloat(v); return isNaN(x)?0:x; }
function fmt(n,d=2){ if(n===null||n===undefined||isNaN(n))return""; return Number(n).toFixed(d); }
function idxGrade(g){ const i=DB.grades.indexOf(g); return i===-1?null:i; }
function fracSelect(sel){ if(!sel)return 0; return num(sel.value||"0")/100; }

/* helper to add/remove error highlight */
function setError(elOrId, isError){
    if(!elOrId) return;
    let el = elOrId;
    if(typeof elOrId === "string"){
        el = document.getElementById(elOrId);
    }
    if(!el) return;
    if(isError) el.classList.add("error");
    else el.classList.remove("error");
}

// ---------- Fine aggregates ----------
function calcFineAggregates(){
    const b1=fracSelect(document.getElementById("fa_blend1"));
    const b2=fracSelect(document.getElementById("fa_blend2"));
    const s=b1+b2||1;

    const fm1=num(document.getElementById("fa_fm1").value);
    const fm2=num(document.getElementById("fa_fm2").value);
    const sp1=num(document.getElementById("fa_sp1").value);
    const sp2=num(document.getElementById("fa_sp2").value);
    const a1 =num(document.getElementById("fa_abs1").value);
    const a2 =num(document.getElementById("fa_abs2").value);
    const m1 =num(document.getElementById("fa_mc1").value);
    const m2 =num(document.getElementById("fa_mc2").value);

    const sumBlend = (b1 + b2) * 100;
    const hasBlend = sumBlend > 0;
    const blendError = hasBlend && Math.abs(sumBlend - 100) > 0.01;

    setError("fa_blend1", blendError);
    setError("fa_blend2", blendError);
    setError("fa_blend_comb", blendError);

    document.getElementById("fa_blend_comb").textContent = fmt(sumBlend,1)+" %";
    document.getElementById("fa_fm_comb").textContent    = fmt((fm1*b1+fm2*b2)/s,2);
    document.getElementById("fa_sp_comb").textContent    = fmt((sp1*b1+sp2*b2)/s,3);
    document.getElementById("fa_abs_comb").textContent   = fmt((a1*b1+a2*b2)/s,2);
    document.getElementById("fa_mc_comb").textContent    = fmt((m1*b1+m2*b2)/s,2);
}

// ---------- Coarse aggregates ----------
function calcCoarseAggregates(){
    const b20 =fracSelect(document.getElementById("ca_b20"));
    const b125=fracSelect(document.getElementById("ca_b125"));
    const b10 =fracSelect(document.getElementById("ca_b10"));
    const s=b20+b125+b10||1;

    const d20 =num(document.getElementById("ca_d20").value);
    const d125=num(document.getElementById("ca_d125").value);
    const d10 =num(document.getElementById("ca_d10").value);
    const sp20 =num(document.getElementById("ca_sp20").value);
    const sp125=num(document.getElementById("ca_sp125").value);
    const sp10 =num(document.getElementById("ca_sp10").value);
    const a20  =num(document.getElementById("ca_abs20").value);
    const a125 =num(document.getElementById("ca_abs125").value);
    const a10  =num(document.getElementById("ca_abs10").value);
    const m20  =num(document.getElementById("ca_mc20").value);
    const m125 =num(document.getElementById("ca_mc125").value);
    const m10  =num(document.getElementById("ca_mc10").value);

    const blendSum = (b20 + b125 + b10) * 100;
    const hasBlend = blendSum > 0;
    const blendError = hasBlend && Math.abs(blendSum - 100) > 0.01;

    setError("ca_b20", blendError);
    setError("ca_b125", blendError);
    setError("ca_b10", blendError);
    setError("ca_b_comb", blendError);

    document.getElementById("ca_b_comb").textContent   = fmt(blendSum,0)+" %";
    document.getElementById("ca_d_comb").textContent   = fmt((d20*b20+d125*b125+d10*b10)/s,0);
    document.getElementById("ca_sp_comb").textContent  = fmt((sp20*b20+sp125*b125+sp10*b10)/s,3);
    document.getElementById("ca_abs_comb").textContent = fmt((a20*b20+a125*b125+a10*b10)/s,3);
    document.getElementById("ca_mc_comb").textContent  = fmt((m20*b20+m125*b125+m10*b10)/s,3);
}

// ---------- Main calculation ----------
function mainCalc(){
    const grade=num(document.getElementById("in_grade").value);
    const chemType=document.getElementById("in_chemtype").value;
    const slump=document.getElementById("in_slump").value;

    const i=idxGrade(grade);
    if(i===null){
        setError("in_grade", true);
        return;
    } else {
        setError("in_grade", false);
    }

    const totalCem=DB.cement[i];
    const wc=DB.wcr[i];
    const highChemLit=DB.highChem[i];

    const useCem  =document.getElementById("use_cement").checked;
    const useFly  =document.getElementById("use_fly").checked;
    const useMicro=document.getElementById("use_micro").checked;
    const useGgbs =document.getElementById("use_ggbs").checked;

    // manual binder %
    const mC = num(document.getElementById("pct_cem_manual").value);
    const mF = num(document.getElementById("pct_fly_manual").value);
    const mM = num(document.getElementById("pct_micro_manual").value);
    const mG = num(document.getElementById("pct_ggbs_manual").value);

    const manualSum =
        (useCem  ? mC : 0) +
        (useFly  ? mF : 0) +
        (useMicro? mM : 0) +
        (useGgbs ? mG : 0);

    const hasManual = manualSum > 0;
    const manualError = hasManual && Math.abs(manualSum - 100) > 0.01;

    setError("pct_cem_manual", manualError);
    setError("pct_fly_manual", manualError);
    setError("pct_micro_manual", manualError);
    setError("pct_ggbs_manual", manualError);

    let cem, fly, micro, ggbs;

    if(hasManual){
        const fC = useCem  ? mC/manualSum : 0;
        const fF = useFly  ? mF/manualSum : 0;
        const fM = useMicro? mM/manualSum : 0;
        const fG = useGgbs ? mG/manualSum : 0;

        cem   = totalCem * fC;
        fly   = totalCem * fF;
        micro = totalCem * fM;
        ggbs  = totalCem * fG;
    } else {
        // default binder split 67/25/8%
        cem   = totalCem*0.67;
        fly   = totalCem*0.25;
        micro = totalCem*0.08;
        ggbs  = 0;
    }

    // apply USE flags for default mode
    if(!useFly){ cem += fly; fly =0; }
    if(!useMicro){ cem += micro; micro=0; }

    if(useGgbs){
        if(!hasManual){
            ggbs = totalCem*0.25;
            cem -= totalCem*0.25;
        }
    } else {
        if(!hasManual){
            ggbs = 0;
        }
    }
    if(!useCem) cem=0;

    // total binder shown in Used column
    const binder = cem+fly+micro+ggbs;
    const totalCemCell = document.getElementById("total_cem_cell");
    if (totalCemCell) {
        totalCemCell.textContent = fmt(binder,1);
        setError(totalCemCell, manualError);
    }

    const sgCem  = num(document.getElementById("sg_cement").value) || 3.15;
    const sgFly  = num(document.getElementById("sg_fly").value)    || 2.20;
    const sgMicro= num(document.getElementById("sg_micro").value)  || 2.20;
    const sgGgbs = num(document.getElementById("sg_ggbs").value)   || 2.90;
    const sgNorm = num(document.getElementById("sg_normal").value) || 1.19;
    const sgHigh = num(document.getElementById("sg_high").value)   || 1.10;

    const faSpComb = num(document.getElementById("fa_sp_comb").textContent) || 2.61;
    const faAbsComb= num(document.getElementById("fa_abs_comb").textContent) || 0.9;
    const faMcComb = num(document.getElementById("fa_mc_comb").textContent)  || 0.5;

    const b20 =fracSelect(document.getElementById("ca_b20"));
    const b125=fracSelect(document.getElementById("ca_b125"));
    const b10 =fracSelect(document.getElementById("ca_b10"));
    const d20 =num(document.getElementById("ca_d20").value);
    const d125=num(document.getElementById("ca_d125").value);
    const d10 =num(document.getElementById("ca_d10").value);
    const sp20 =num(document.getElementById("ca_sp20").value)  || 2.7;
    const sp125=num(document.getElementById("ca_sp125").value) || 2.89;
    const sp10 =num(document.getElementById("ca_sp10").value)  || 2.85;
    const caAbs20 =num(document.getElementById("ca_abs20").value) || 0;
    const caAbs125=num(document.getElementById("ca_abs125").value) || 0.5;
    const caAbs10 =num(document.getElementById("ca_abs10").value)  || 0.74;
    const caMc20  =num(document.getElementById("ca_mc20").value)   || 0;
    const caMc125 =num(document.getElementById("ca_mc125").value)  || 0.18;
    const caMc10  =num(document.getElementById("ca_mc10").value)   || 0.15;

    const sgAdm   = (chemType==="High Range") ? sgHigh : sgNorm;

    const waterBase = binder*wc;
    const chemMass  = (chemType==="High Range") ? highChemLit : totalCem*0.02;

    const cemVol   = cem   / (sgCem*1000);
    const flyVol   = fly   / (sgFly*1000);
    const microVol = micro / (sgMicro*1000);
    const ggbsVol  = ggbs  / (sgGgbs*1000);
    const waterVol = waterBase/1000;
    const chemVol  = chemMass/(sgAdm*1000);
    const airVol   = 0.025;
    const airMass  = 0.025;

    // NEW COARSE & SAND CALC (new Excel logic)
    const druwMix = d20*b20 + d125*b125 + d10*b10;

    // paste volume without aggregates
    const volPaste = cemVol + flyVol + microVol + ggbsVol + waterVol + chemVol + airVol;

    const weightCoarse0 = druwMix * volPaste;   // ≈ DRUW mix * paste vol
    const K26 = weightCoarse0 / 1000;
    const K28 = (58 - K26) / 100;

    const vol20  = K28 * (1 - volPaste) * b20;
    const vol125 = K28 * (1 - volPaste) * b125;
    const vol10  = K28 * (1 - volPaste) * b10;

    const sandVol  = 1 - (volPaste + vol20 + vol125 + vol10);
    const w20      = vol20  * sp20  * 1000;
    const w125     = vol125 * sp125 * 1000;
    const w10      = vol10  * sp10  * 1000;
    const sandMass = sandVol * faSpComb * 1000;

    const waterCorr =
        waterBase +
        (caAbs20 - caMc20 )/100 * w20  +
        (caAbs125- caMc125)/100 * w125 +
        (caAbs10 - caMc10 )/100 * w10  +
        (faAbsComb - faMcComb)/100 * sandMass;

    const waterCorrVol = waterCorr/1000;

    const corr20   = w20  * (1 + caMc20 /100);
    const corr125  = w125 * (1 + caMc125/100);
    const corr10   = w10  * (1 + caMc10 /100);
    const corrSand = sandMass * (1 + faMcComb/100);

    const totalMass =
        cem+fly+micro+ggbs+
        waterCorr+chemMass+airMass+
        corr20+corr125+corr10+corrSand;

    function pct(x){ return totalMass ? x*100/totalMass : 0; }

    // ---- DESIGN PARAMETERS TABLE ----
    document.getElementById("c_cem").textContent   = fmt(cem,1);
    document.getElementById("c_fly").textContent   = fmt(fly,1);
    document.getElementById("c_micro").textContent = fmt(micro,1);
    document.getElementById("c_ggbs").textContent  = fmt(ggbs,1);

    document.getElementById("wc_ratio").textContent = fmt(wc,3);
    document.getElementById("c_fc").textContent     = fmt(grade,0);
    document.getElementById("c_slump").textContent  = slump;
    document.getElementById("c_air").textContent    = fmt(airVol,3);
    document.getElementById("weight_coarse").textContent = fmt(weightCoarse0,1);
    document.getElementById("adm_high").textContent = fmt(highChemLit,1);
    document.getElementById("adm_normal").textContent = fmt(totalCem*0.02,1);

    // ---- DESIGN MIX TABLE ----
    document.getElementById("cem_pct").textContent      = fmt(pct(cem),2);
    document.getElementById("cem_vol").textContent      = fmt(cemVol,4);
    document.getElementById("cem_bw").textContent       = fmt(cem,1);
    document.getElementById("cem_bw_corr").textContent  = fmt(cem,1);

    document.getElementById("fly_pct").textContent      = fmt(pct(fly),2);
    document.getElementById("fly_vol").textContent      = fmt(flyVol,4);
    document.getElementById("fly_bw").textContent       = fmt(fly,1);
    document.getElementById("fly_bw_corr").textContent  = fmt(fly,1);

    document.getElementById("ms_pct").textContent       = fmt(pct(micro),2);
    document.getElementById("ms_vol").textContent       = fmt(microVol,4);
    document.getElementById("ms_bw").textContent        = fmt(micro,1);
    document.getElementById("ms_bw_corr").textContent   = fmt(micro,1);

    document.getElementById("ggbs_pct").textContent      = fmt(pct(ggbs),2);
    document.getElementById("ggbs_vol").textContent      = fmt(ggbsVol,4);
    document.getElementById("ggbs_bw").textContent       = fmt(ggbs,1);
    document.getElementById("ggbs_bw_corr").textContent  = fmt(ggbs,1);

    document.getElementById("w_pct").textContent        = fmt(pct(waterCorr),2);
    document.getElementById("w_vol").textContent        = fmt(waterVol,4);
    document.getElementById("w_bw").textContent         = fmt(waterBase,1);
    document.getElementById("w_bw_corr").textContent    = fmt(waterCorr,1);

    document.getElementById("ad_pct").textContent       = fmt(pct(chemMass),2);
    document.getElementById("ad_vol").textContent       = fmt(chemVol,4);
    document.getElementById("ad_bw").textContent        = fmt(chemMass,2);
    document.getElementById("ad_bw_corr").textContent   = fmt(chemMass,2);

    document.getElementById("air_pct").textContent      = fmt(pct(airMass),2);
    document.getElementById("air_vol").textContent      = fmt(airVol,4);
    document.getElementById("air_bw").textContent       = fmt(airMass,3);
    document.getElementById("air_bw_corr").textContent  = fmt(airMass,3);

    document.getElementById("ca20_pct").textContent     = fmt(pct(corr20),2);
    document.getElementById("ca20_vol").textContent     = fmt(vol20,4);
    document.getElementById("ca20_bw").textContent      = fmt(w20,1);
    document.getElementById("ca20_bw_corr").textContent = fmt(corr20,1);

    document.getElementById("ca125_pct").textContent    = fmt(pct(corr125),2);
    document.getElementById("ca125_vol").textContent    = fmt(vol125,4);
    document.getElementById("ca125_bw").textContent     = fmt(w125,1);
    document.getElementById("ca125_bw_corr").textContent= fmt(corr125,1);

    document.getElementById("ca10_pct").textContent     = fmt(pct(corr10),2);
    document.getElementById("ca10_vol").textContent     = fmt(vol10,4);
    document.getElementById("ca10_bw").textContent      = fmt(w10,1);
    document.getElementById("ca10_bw_corr").textContent = fmt(corr10,1);

    document.getElementById("fa2_pct").textContent      = fmt(pct(corrSand),2);
    document.getElementById("fa2_vol").textContent      = fmt(sandVol,4);
    document.getElementById("fa2_bw").textContent       = fmt(sandMass,1);
    document.getElementById("fa2_bw_corr").textContent  = fmt(corrSand,1);

    const totalVol = cemVol+flyVol+microVol+ggbsVol+waterVol+chemVol+airVol+vol20+vol125+vol10+sandVol;
    const massUncorr = cem+fly+micro+ggbs+waterBase+chemMass+airMass+w20+w125+w10+sandMass;

    document.getElementById("tot_pct").textContent     = "100.00";
    document.getElementById("tot_vol").textContent     = fmt(totalVol,3);
    document.getElementById("tot_bw").textContent      = fmt(massUncorr,1);
    document.getElementById("tot_bw_corr").textContent = fmt(totalMass,1);

    // ---- FINAL OUTPUT TABLE ----
    document.getElementById("out_grade").textContent  = fmt(grade,0)+" Mpa";
    document.getElementById("out_cement").textContent = fmt(totalCem,1);
    document.getElementById("out_wc").textContent     = fmt(wc,3);

    document.getElementById("fo_cem_bw").textContent  = fmt(cem,1);
    document.getElementById("fo_cem_pct").textContent = fmt(pct(cem),2);
    document.getElementById("fo_cem_vol").textContent = fmt(cemVol,3);

    document.getElementById("fo_fly_bw").textContent  = fmt(fly,1);
    document.getElementById("fo_fly_pct").textContent = fmt(pct(fly),2);
    document.getElementById("fo_fly_vol").textContent = fmt(flyVol,3);

    document.getElementById("fo_ms_bw").textContent   = fmt(micro,1);
    document.getElementById("fo_ms_pct").textContent  = fmt(pct(micro),2);
    document.getElementById("fo_ms_vol").textContent  = fmt(microVol,3);

    document.getElementById("fo_ggbs_bw").textContent  = fmt(ggbs,1);
    document.getElementById("fo_ggbs_pct").textContent = fmt(pct(ggbs),2);
    document.getElementById("fo_ggbs_vol").textContent = fmt(ggbsVol,3);

    document.getElementById("fo_w_bw").textContent    = fmt(waterCorr,1);
    document.getElementById("fo_w_pct").textContent   = fmt(pct(waterCorr),2);
    document.getElementById("fo_w_vol").textContent   = fmt(waterCorrVol,3);

    document.getElementById("fo_ad_bw").textContent   = fmt(chemMass,2);
    document.getElementById("fo_ad_pct").textContent  = fmt(pct(chemMass),2);
    document.getElementById("fo_ad_vol").textContent  = fmt(chemVol,3);

    document.getElementById("fo_air_bw").textContent  = fmt(airMass,3);
    document.getElementById("fo_air_pct").textContent = fmt(pct(airMass),3);
    document.getElementById("fo_air_vol").textContent = fmt(airVol,3);

    document.getElementById("fo_ca20_bw").textContent = fmt(corr20,1);
    document.getElementById("fo_ca20_pct").textContent= fmt(pct(corr20),2);
    document.getElementById("fo_ca20_vol").textContent= fmt(vol20,3);

    document.getElementById("fo_ca125_bw").textContent = fmt(corr125,1);
    document.getElementById("fo_ca125_pct").textContent= fmt(pct(corr125),2);
    document.getElementById("fo_ca125_vol").textContent= fmt(vol125,3);

    document.getElementById("fo_ca10_bw").textContent = fmt(corr10,1);
    document.getElementById("fo_ca10_pct").textContent= fmt(pct(corr10),2);
    document.getElementById("fo_ca10_vol").textContent= fmt(vol10,3);

    document.getElementById("fo_fa_bw").textContent   = fmt(corrSand,1);
    document.getElementById("fo_fa_pct").textContent  = fmt(pct(corrSand),2);
    document.getElementById("fo_fa_vol").textContent  = fmt(sandVol,3);

    document.getElementById("fo_tot_bw").textContent  = fmt(totalMass,1);
    document.getElementById("fo_tot_pct").textContent = "100.00";
    document.getElementById("fo_tot_vol").textContent = fmt(totalVol,3);
}

// ---------- Bind ----------
function bindAll(){
    const els=document.querySelectorAll("input,select");
    els.forEach(el=>{
        el.addEventListener("input",()=>{calcFineAggregates();calcCoarseAggregates();mainCalc();});
        el.addEventListener("change",()=>{calcFineAggregates();calcCoarseAggregates();mainCalc();});
    });
    calcFineAggregates();
    calcCoarseAggregates();
    mainCalc();
}

document.addEventListener("DOMContentLoaded",bindAll);
