-- Migration: Fix hms_operation_board_create function bug
-- Description: Corrects the comparison bug in WHERE clause where hob_operation_board_id was compared to the table name hms_operation_board instead of v_board_id

CREATE OR REPLACE FUNCTION public.hms_operation_board_create(
    p_docno integer, 
    p_date text, 
    p_deptid text, 
    p_roomid integer, 
    p_operation_table integer, 
    p_status text, 
    p_rettime integer, 
    p_retdept text, 
    p_conscious_date text
)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
  DECLARE
  v_board_id      INTEGER;
  v_res           INTEGER;
  v_count         INTEGER;
  v_orderdate     TIMESTAMP;
  v_consciousdate TIMESTAMP;
BEGIN
  v_res           := 0;
  v_orderdate     := to_timestamp(p_date, 'YYYY-MM-DD HH24:MI:SS');
  v_consciousdate := to_timestamp(p_conscious_date, 'YYYY-MM-DD HH24:MI:SS');
  
  IF trunc(v_orderdate) < TRUNC(CURRENT_DATE) THEN
    RETURN -1;
  END IF;
  
  IF TRUNC(v_consciousdate) < TRUNC(CURRENT_DATE) THEN
    RETURN -2;
  END IF;
  
  --
  IF TRUNC(v_orderdate) > TRUNC(v_consciousdate) THEN
    RETURN -3;
  END IF;
  
  -- Find if a board entry already exists for this document and date
  SELECT MAX(hob_operation_board_id)
  INTO v_board_id
  FROM hms_operation_board
  WHERE hob_docno     = p_docno
  AND TRUNC(hob_date) = trunc(v_orderdate);
  
  IF v_board_id > 0 THEN
    -- Bug Fix: Changed `WHERE hob_operation_board_id = hms_operation_board` to `WHERE hob_operation_board_id = v_board_id`
    UPDATE hms_operation_board
    SET hob_date                 = trunc(v_orderdate),
      hob_performdate            = v_orderdate,
      hob_roomid                 = p_roomid,
      hob_deptid                 = p_deptid,
      hob_status                 = p_status,
      hob_rettime                = p_rettime,
      hob_retdept                = p_retdept,
      hob_conscious_date         = v_consciousdate,
      hob_operation_table        = p_operation_table
    WHERE hob_operation_board_id = v_board_id;
    
    GET DIAGNOSTICS v_res = ROW_COUNT;
  ELSE
    -- Generate new board ID
    SELECT COALESCE(MAX(hob_operation_board_id),0)+1
    INTO v_board_id
    FROM hms_operation_board;
    
    -- Insert new record
    INSERT INTO hms_operation_board (
        HOB_OPERATION_BOARD_ID,
        HOB_DATE,
        HOB_PERFORMDATE,
        HOB_DOCNO,
        HOB_ROOMID,
        HOB_DEPTID,
        HOB_STATUS,
        HOB_RETTIME,
        HOB_RETDEPT,
        HOB_CONSCIOUS_DATE,
        HOB_OPERATION_TABLE
    )
    VALUES (
        v_board_id,
        trunc(v_orderdate),
        v_orderdate,
        p_docno,
        p_roomid,
        p_deptid,
        p_status,
        p_rettime,
        p_retdept,
        v_consciousdate,
        p_operation_table
    );
    
    GET DIAGNOSTICS v_res = ROW_COUNT;
  END IF;
  
  RETURN v_res;
END;
$function$;
